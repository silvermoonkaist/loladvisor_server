module.exports = function(mongoose) {
    var Schema = mongoose.Schema;
    var MatchModel = new Schema({
        matchId             :    {type: String, index: { unique: true }},
        winner              :    {
            top             :    {
                summonerId  :    {type : String},
                championId  :    {type : String}
            },
            jungle          :    {
                summonerId  :    {type : String},
                championId  :    {type : String}
            },
            middle          :    {
                summonerId  :    {type : String},
                championId  :    {type : String}
            },
            adcarry         :    {
                summonerId  :    {type : String},
                championId  :    {type : String}
            },
            support         :    {
                summonerId  :    {type : String},
                championId  :    {type : String}
            }
        },
        loser               :    {
            top             :    {
                summonerId  :    {type : String},
                championId  :    {type : String}
            },
            jungle          :    {
                summonerId  :    {type : String},
                championId  :    {type : String}
            },
            middle          :    {
                summonerId  :    {type : String},
                championId  :    {type : String}
            },
            adcarry         :    {
                summonerId  :    {type : String},
                championId  :    {type : String}
            },
            support         :    {
                summonerId  :    {type : String},
                championId  :    {type : String}
            }
        },
    });

    return mongoose.model('Match', MatchModel);
}