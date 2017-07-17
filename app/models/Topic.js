var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// var File = require("./File.js");
// var fileSchema = File.schema;

//====topicSchema====
var topicSchema = new Schema(
	{
		topicName:{
			type:String,
			unique:true,
			required:true
		},
		topicDescription:{
			type:String,
			required:true
		},
		topicField:String,
		files:[
			{
                type: mongoose.Schema.Types.ObjectId,
                ref: "File"
            }
		]
	}
);

//topic model
module.exports = mongoose.model("Topic", topicSchema);