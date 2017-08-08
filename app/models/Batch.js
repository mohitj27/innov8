var mongoose = require("mongoose");
var Schema = mongoose.Schema;

//====subjectSchema====
var batchSchema = new Schema(
	{
		batchName:{
            type:String,
            required:true
        },
        subject:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"Subject"
            }
        ]
	}
);

//subject model
module.exports = mongoose.model("Batch", batchSchema);