var express = require('express');
var app = express();
var http = require('http');
var https = require('https');
var request = require("request");
var fs = require('fs');


var champion = require('./champion.json');
var championShort = require('./championShort.json');
var challenger = require('./challenger.json');
var master = require('./master.json');
var matchList = require('./matchlistTot.json');
var keys = require('./keys.json');


var mongoose = require('mongoose');
var Match = require('./models')(mongoose);

mongoose.connect('mongodb://localhost/test');



var histoSort = function(a, b) {
    return (a.count < b.count) ? 1 : ((a.count > b.count) ? -1 : 0);
};
var rateSort = function(a, b) {
    return (a.rate < b.rate) ? 1 : ((a.rate > b.rate) ? -1 : 0);
};


var histoCalculate = function(q, docs, position){
	var histogram = {}, histogram_win = {}, histogram_lose = {};
	console.log(q);

	for(var i in docs){
		var d = docs[i];
		var ww = {}, ll = {};
		ww[1] = d.winner.top;
		ww[2] = d.winner.jungle;
		ww[3] = d.winner.middle;
		ww[4] = d.winner.adcarry;
		ww[5] = d.winner.support;

		ll[1] = d.loser.top;
		ll[2] = d.loser.jungle;
		ll[3] = d.loser.middle;
		ll[4] = d.loser.adcarry;
		ll[5] = d.loser.support;

		var wincase = true;
		for(var ti = 1; ti <= 5; ti ++){
			var we = q["a" + ti];
			var you = q["b" + ti];

			if(we != 0 && we != undefined && we != ww[ti].championId){wincase = false;
			}
			if(you != 0 && you != undefined && you+"" != ll[ti].championId) wincase = false;
		}
		//console.log(wincase);

		var laneId = position;
		if(wincase){
			var myid = ww[laneId].championId;
			if(!histogram.hasOwnProperty(myid)){
				histogram[myid] = 0;
			}
			if(!histogram_win.hasOwnProperty(myid)){
				histogram_win[myid] = 0;
			}

			histogram[myid] ++;
			histogram_win[myid] ++;
			//console.log("wincase : " + champName(myid));
		}
		else{
			var myid = ll[laneId].championId;
			if(!histogram.hasOwnProperty(myid)){
				histogram[myid] = 0;
			}
			if(!histogram_lose.hasOwnProperty(myid)){
				histogram_lose[myid] = 0;
			}

			histogram[myid] ++;
			histogram_lose[myid] ++;
			//console.log("losecase : " + champName(myid));
			//console.log("lose", histogram[lcid], histogram_lose[lcid]);
			
		}




		
		//console.log("win", histogram[wcid], histogram_win[wcid]);
		

		/*
		console.log("----- MATCH " + d.matchId + " -----");
		console.log("TOP\t\t" + champName(ww[1].championId) + " - " + champName(ll[1].championId));
		console.log("JUNGLE\t\t" + champName(ww[2].championId) + " - " + champName(ll[2].championId));
		console.log("MIDDLE\t\t" + champName(ww[3].championId) + " - " + champName(ll[3].championId));
		console.log("ADCARRY\t\t" + champName(ww[4].championId) + " - " + champName(ll[4].championId));
		console.log("SUPPORT\t\t" + champName(ww[5].championId) + " - " + champName(ll[5].championId));
		*/

	}

	var arr = [];
	for(var k in histogram){
		arr.push({championId : k, count : histogram[k]});
	}

	var arr_win = [];
	for(var k in histogram_win){
		var kkk = 1.0*histogram_win[k]/histogram[k];
		if(kkk == 1.0) continue;
		arr_win.push({championId : k, count : kkk});
	}

	var arr_lose = [];
	for(var k in histogram_lose){
		var kkk = 1.0*histogram_lose[k]/histogram[k];
		if(kkk == 1.0) continue;
		arr_lose.push({championId : k, count : kkk});
	}

	arr.sort(histoSort);
	arr_win.sort(histoSort);
	arr_lose.sort(histoSort);

	var rtn = {};

	console.log("Most picked in my position");
	for(var i = 0; i < 10 && i < arr.length; i++){
		var k = arr[i].championId;
		var kkk = 1.0*histogram_win[k]/histogram[k];

		console.log("champ: " + champName(arr[i].championId) + ", count: " + arr[i].count);
		rtn["dm" + i] = {
			name : champName(arr[i].championId),
			rate : kkk,
			count : arr[i].count
		}
	}

	console.log("Most win champ in my position");
	for(var i = 0; i < 10 && i < arr_win.length; i++){
		var k = arr[i].championId;

		console.log("champ: " + champName(arr_win[i].championId)
					 + ", rate: " + arr_win[i].count
					 + ", count: " + histogram[arr_win[i].championId]);
		rtn["dw" + i] = {
			name : champName(arr_win[i].championId),
			rate : arr_win[i].count,
			count : histogram[arr_win[i].championId]
		}
	}

	console.log("Most lose champ in my position");
	for(var i = 0; i < 10 && i < arr_lose.length; i++){
		var k = arr[i].championId;

		console.log("champ: " + champName(arr_lose[i].championId)
					 + ", rate: " + (1-arr_lose[i].count)
					 + ", count: " + histogram[arr_lose[i].championId]);
		rtn["dl" + i] = {
			name : champName(arr_lose[i].championId),
			rate : (1-arr_lose[i].count),
			count : histogram[arr_lose[i].championId]
		}
	}

	return rtn;
}

var createQuery = function(a1, a2, a3, a4, a5, b1, b2, b3, b4, b5){
	var tmpand = [], qmpand = [];
	if(a1 != 0 && a1 != undefined){
		tmpand.push({key: ".top.championId", val: a1});
	}
	if(a2 != 0 && a2 != undefined){
		tmpand.push({key: ".jungle.championId", val: a2});
	}
	if(a3 != 0 && a3 != undefined){
		tmpand.push({key: ".middle.championId", val: a3});
	}
	if(a4 != 0 && a4 != undefined){
		tmpand.push({key: ".adcarry.championId", val: a4});
	}
	if(a5 != 0 && a5 != undefined){
		tmpand.push({key: ".support.championId", val: a5});
	}

	if(b1 != 0 && b1 != undefined){
		qmpand.push({key: ".top.championId", val: b1});
	}
	if(b2 != 0 && b2 != undefined){
		qmpand.push({key: ".jungle.championId", val: b2});
	}
	if(b3 != 0 && b3 != undefined){
		qmpand.push({key: ".middle.championId", val: b3});
	}
	if(b4 != 0 && b4 != undefined){
		qmpand.push({key: ".adcarry.championId", val: b4});
	}
	if(b5 != 0 && b5 != undefined){
		qmpand.push({key: ".support.championId", val: b5});
	}

	var and1 = [], and2 = [];
	for(var i in tmpand){
		var key1 = "winner" + tmpand[i].key;
		var key2 = "loser" + tmpand[i].key;
		var value = tmpand[i].val;
		var obj1 = {}, obj2 = {};
		obj1[key1] = value;
		obj2[key2] = value;
		and1.push(obj1);
		and2.push(obj2);
	}
	for(var i in qmpand){
		var key1 = "loser" + qmpand[i].key;
		var key2 = "winner" + qmpand[i].key;
		var value = qmpand[i].val;
		var obj1 = {}, obj2 = {};
		obj1[key1] = value;
		obj2[key2] = value;
		and1.push(obj1);
		and2.push(obj2);
	}
	
	var rtn = {};
	rtn.t1 = and1;
	rtn.t2 = and2;
	console.log(and1, and2);
	return rtn;
}




var entries_cha = challenger.entries;
var entries_mas = master.entries;
var sortFunction = function(a, b) {
    return (a.leaguePoints < b.leaguePoints) ? 1 : ((a.leaguePoints > b.leaguePoints) ? -1 : 0);
};


entries_cha.sort(sortFunction);
entries_mas.sort(sortFunction);


var champName = function(kid){
	return keys[kid];
}

var caseBy = function(v){
	if(v.timeline.role == "SOLO" && v.timeline.lane == "TOP"){
		return 1;
	}
	if(v.timeline.role == "NONE" && v.timeline.lane == "JUNGLE"){
		return 2;
	}
	if(v.timeline.role == "SOLO" && v.timeline.lane == "MIDDLE"){
		return 3;
	}
	if(v.timeline.role == "DUO_CARRY" && v.timeline.lane == "BOTTOM"){
		return 4;
	}
	if(v.timeline.role == "DUO_SUPPORT" && v.timeline.lane == "BOTTOM"){
		return 5;
	}
	return -1;
}



//for(var idx = 0; idx < matchList.length && idx < 20; idx++)
/*
var idx = 0;
var repeat = setInterval(function(){
	if(idx >= matchList.length){
		clearInterval(repeat);
		return;
	}

	var t = matchList[idx];
	var obj = JSON.parse(fs.readFileSync(__dirname + '/match/' + t + ".json", 'utf8'));

	var fail = false;
	var ww = {}, ll = {};
	for(var i = 0; i < 10; i++){
		if(!obj.hasOwnProperty("participants"))
			continue;

		var v = obj.participants[i];
		var pIds = obj.participantIdentities;
		var c = caseBy(v);
		if(v.stats.winner){
			if(c < 0){
				fail = true;
				break;
			}
			ww[c] = {};
			ww[c].championId = v.championId;
			for(var z = 0; z < 10; z++){
				if(pIds[z].participantId == v.participantId){
					ww[c].summonerId = pIds[z].player.summonerId;
					break;
				}
			}
		}
		else{
			if(c < 0){
				fail = true;
				break;
			}
			ll[c] = {};
			ll[c].championId = v.championId;
			for(var z = 0; z < 10; z++){
				if(pIds[z].participantId == v.participantId){
					ll[c].summonerId = pIds[z].player.summonerId;
					break;
				}
			}
		}
	}
	var la = Object.keys(ww).length;
	var lb = Object.keys(ll).length;

	if(la < 5 || lb < 5) fail = true;

	if(!fail){
		console.log("----- MATCH " + t + " -----");
		console.log("TOP\t\t" + champName(ww[1].championId) + " - " + champName(ll[1].championId));
		console.log("JUNGLE\t\t" + champName(ww[2].championId) + " - " + champName(ll[2].championId));
		console.log("MIDDLE\t\t" + champName(ww[3].championId) + " - " + champName(ll[3].championId));
		console.log("ADCARRY\t\t" + champName(ww[4].championId) + " - " + champName(ll[4].championId));
		console.log("SUPPORT\t\t" + champName(ww[5].championId) + " - " + champName(ll[5].championId));


		var kitty = new Match({
			matchId : t,
			winner : {
				top : ww[1],
				jungle : ww[2],
				middle : ww[3],
				adcarry : ww[4],
				support : ww[5]
			},
			loser : {
				top : ll[1],
				jungle : ll[2],
				middle : ll[3],
				adcarry : ll[4],
				support : ll[5]
			}
		});
		kitty.save(function (err) {
			if (err) console.log('fucked');
			console.log("save success");
		});

		console.log("save to db... " + kitty.id);
	}

	//console.log(obj.participantIdentities);
	idx ++;
}, 10);


*/
/*
var akey1 = "fefe8394-c30a-405b-83ea-354337622a74";
var akey2 = "5a38a939-c3ca-4e37-8df1-1b112cd96901";

var apiURL = function(id, i){
	var akey = ''
	if(i == 1) akey = akey1;
	else akey = akey2;

	return "https://kr.api.pvp.net/api/lol/kr/v2.2/match/" + id + 
	"?api_key=" + akey;
};


var count = 0;
var repeat = setInterval(function(){

	var mid = matchList[count];
	var url = apiURL(mid, 1);

	request(url, function(error, response, body) {
		console.log(body);
		fs.writeFile(__dirname + "/match/" + mid + ".json", body, function(err) {
		    if(err) {
		        return console.log(err);
		    }
		    console.log("File for " + mid + " was saved!");
		}); 
	});

	
	if(count+1 >= matchList.legnth)
		clearInterval(repeat);

	var mid2 = matchList[count+1];
	var url2 = apiURL(mid, 2);

	request(url2, function(error, response, body) {
		console.log(body);
		fs.writeFile(__dirname + "/match/" + mid2 + ".json", body, function(err) {
		    if(err) {
		        return console.log(err);
		    }
		    console.log("File for " + mid2 + " was saved!");
		}); 
	});

	count += 2;
	if(count >= matchList.legnth)
		clearInterval(repeat);

}, 2000);

*/




/*
fs.writeFile(__dirname + "/keys.json", JSON.stringify(keys), function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
});
*/
/*



console.log(championShort.data[keys[432]].name);
console.log(entries_cha[0]);
console.log(entries_cha[0].playerOrTeamId);
//console.log(entries_cha[1]);
//console.log(entries_mas[2]);
//console.log(entries_mas[3]);
//console.log(entries_cha[32]);
console.log(entries_cha.length);
console.log(entries_mas.length);
*/


/*
var apiURL = function(pid){
	return "https://kr.api.pvp.net/api/lol/kr/v2.2/matchlist/by-summoner/" + pid + 
"?rankedQueues=RANKED_SOLO_5x5&seasons=PRESEASON2016,SEASON2016&api_key=fefe8394-c30a-405b-83ea-354337622a74";
};

var pid = 25260179;
var url = apiURL(pid);

request(url, function(error, response, body) {
	console.log(body);
	fs.writeFile(__dirname + "/match/" + pid + ".json", body, function(err) {
	    if(err) {
	        return console.log(err);
	    }
	    console.log("The file was saved!");
	}); 
});
*/



/*

var count = 0;
var repeat = setInterval(function(){
	if(count >= entries_cha.length)
		clearInterval(repeat);

	var entry = entries_cha[count];
	var pid = entry.playerOrTeamId;
	var url = apiURL(pid);

	request(url, function(error, response, body) {
		console.log(body);
		fs.writeFile(__dirname + "/match/" + pid + ".json", body, function(err) {
		    if(err) {
		        return console.log(err);
		    }
		    console.log("The file was saved!");
		}); 
	});

	count++;
}, 2000);

*/

/*
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');

*/


app.get('/', function (req, res) {
	console.log(req.url);
	var a1 = req.param("a1");
	var a2 = req.param("a2");
	var a3 = req.param("a3");
	var a4 = req.param("a4");
	var a5 = req.param("a5");

	var b1 = req.param("b1");
	var b2 = req.param("b2");
	var b3 = req.param("b3");
	var b4 = req.param("b4");
	var b5 = req.param("b5");

	var pos = req.param("pos");
	if( pos != "1" &&
		pos != "2" &&
		pos != "3" && 
		pos != "4" &&
		pos != "5") return;

	var t = createQuery(a1, a2, a3, a4, a5, b1, b2, b3, b4, b5);
	var fail = false;
	if(t.t1.length == 0){
		console.log("no t1");
		fail = true;
	}
	var qinfo = {
		a1 : a1,
		a2 : a2,
		a3 : a3,
		a4 : a4,
		a5 : a5,
		b1 : b1,
		b2 : b2,
		b3 : b3,
		b4 : b4,
		b5 : b5
	};
	console.log(JSON.stringify(t));
	Match.find(
		{
			$or: [
				{
					$and: t.t1
				},
				{
					$and: t.t2
				}
			]
		}
		/*
		{
			$or: [
				{
					$and: [
						{"loser.middle.championId" : "7"},
						{"winner.support.championId" : "432"}
					]
				},
				{
					$and: [
						{"loser.support.championId" : "432"},
						{"winner.middle.championId" : "7"}
					]
				}
			]
		}
		*/
		//createQuery(0, 0, 7, 0, 0, 0, 0, 0, 0, 432)
		,
		function (err, docs) {
			console.log("found count: " + docs.length);
			var rtn;
			if(!fail)
				rtn = histoCalculate(qinfo, docs, pos);
			else
				rtn = {};

			res.json(rtn);
			//console.log(rtn);
			//res.write("found count: " + docs.length);
			res.end();
		}
	);


});

var server = app.listen(80, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
