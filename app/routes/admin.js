var express = require("express"),
    router = express.Router(),
    passport = require("passport"),
    User = require("../models/User.js"),
    File = require("../models/File.js"),
    Topic = require("../models/Topic.js"),
    Chapter = require("../models/Chapter.js"),
    Subject = require("../models/Subject.js"),
    Class = require("../models/Class.js"),
    path = require('path'),
    multer = require('multer'),
    moment = require("moment-timezone"),
    fs = require("file-system"),
    async = require("async"),
    middleware = require("../middleware");

//setting disk storage for uploaded files
var storage = multer.diskStorage({
	destination: __dirname+ "/../../../uploads/",
	filename: function(req, file, callback) {
		callback(null,Date.now()+"__" +file.originalname);
	}
});

function fileUploadError(req,res){
    //deleting uploaded file from upload directory
    fs.unlink(req.file.path, function(err){
        if(err) {
            console.log("error while deleting uploaded file-->/n");
            console.log(err);
        }
        else console.log("file deleted from uploads directory")
    });

    req.flash("error", err._message);
    res.redirect("/admin/uploadFile");
}

function fileUploadSuccess(req, res){
    req.flash("success", req.file.originalname +" uploaded successfully");
    res.redirect("/admin/uploadFile");
}

router.get("/class/:className", function(req, res){
    Class.findOne({className:req.params.className}, function(err, classes){
		if(err) console.log(err);
	})
	.populate({
		path:"subjects",
		model:"Subject"
		
	})
	.exec(function(err, classs){
		if(err){
			 console.log(err);
             req.flash("error","Couldn't find the chosen class");
			 res.redirect("/admin/uploadFile");
		}
		else{
            res.json({class:classs});
		}
	});
});

router.get("/subject/:subjectName", function(req, res){
    Subject.findOne({subjectName:req.params.subjectName}, function(err, subjects){
		if(err) console.log(err);
	})
	.populate({
		path:"chapters",
		model:"Chapter"
		
	})
	.exec(function(err, subject){
		if(err){
			 console.log(err);
             req.flash("error","Couldn't find the chosen subject");
			 res.redirect("/admin/uploadFile");
		}
		else{
            res.json({subject:subject});
		}
	});
});

router.get("/chapter/:chapterName", function(req, res){
    Chapter.findOne({chapterName:req.params.chapterName}, function(err, chapters){
		if(err) console.log(err);
	})
	.populate({
		path:"topics",
		model:"Topic"
		
	})
	.exec(function(err, chapter){
		if(err){
			 console.log(err);
             req.flash("error","Couldn't find the chosen chapter");
			 res.redirect("/admin/uploadFile");
		}
		else{
            res.json({chapter:chapter});
		}
	});
});


//User registration form-- for admin
router.get("/signup", function(req, res){
    res.render("signup");
});

//Handle user registration-- for admin
router.post("/signup", function(req, res){
    User.register(new User(
            { 
                username : req.body.username,
                isAdmin:true 
            }), req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            req.flash("error", err.message);
            return res.redirect("/admin/signup");
            
        }

        passport.authenticate("local")(req, res, function () {
            req.flash("success","Successfully signed you in as "+ req.body.username);
            res.redirect("/");
        });
    });
});

//User login form-- admin
router.get("/login", function(req, res){
    res.render("login");
});

//Handle user login -- for admin
router.post("/login", passport.authenticate("local", 
    { 
        successRedirect: "/",
        failureRedirect: "/admin/login",
        successFlash:"Welcome back",
        failureFlash:true
    }),
    function(req, res) {
		
    }
);

//User logout-- admin
router.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
});

//Form for uploading a file
router.get('/uploadFile', function(req, res) {
    // res.json(subjects);
	Class.find({}, function(err, classes){
		if(err) console.log(err);
	})
	.populate({
        path:"subjects",
        model:"Subject",
        populate:{
            path:"chapters",
            model:"Chapter",
            populate:{
                path:"topics",
                model:"Topic",
                populate:{
                        path:"files",
                        model:"File"
                }
		    }
        }
	})
	.exec(function(err, classes){
		if(err){
			 console.log(err);
             req.flash("error","Please try again");
			 res.redirect("/admin/uploadFile");
		}
		else{
            res.render('uploadFile',{classes:classes});
		}
	});
});

//Handle file upload
router.post('/uploadFile', function(req, res) {
	var upload = multer({
		storage: storage
	}).single('userFile')
	upload(req, res, function(err) {
        var fileName = req.file.originalname;
        var fileType = path.extname(req.file.originalname);
        var filePath = req.file.path;
        var uploadDate = moment(Date.now()).tz("Asia/Kolkata").format('MMMM Do YYYY, h:mm:ss a');
        var fileSize = req.file.size;
        var className = req.body.className;
        var subjectName = req.body.subjectName;
        var chapterName = req.body.chapterName;
        var topicName = req.body.topicName;

        var newFile = {
            fileName,
            fileType,
            filePath,
            uploadDate,
            fileSize,
            className,
            subjectName,
            chapterName,
            topicName,

        }

        async.waterfall(
            [
                function(callback){
                    File.create(newFile, function(err, createdFile){
                        if(err){
                            console.log("\nerror while storing file in db-->\n");
                            console.log(err);
                            callback(err);
                        }
                        else{
                            // console.log("\nFile created\n");
                            callback(null, createdFile);
                        }
                    });
                },
                function(createdFile, callback){
                    Topic.findOne(
                            {
                                "topicName":topicName
                            },
                            function(err, foundTopic){
                                if(err) {
                                    console.log("finding topic error-->/n")
                                    console.log(err);
                                    // fileUploadError(req,res)
                                    callback(err);
                                }
                                else{
                                    if(foundTopic != null){
                                        //we found one topic 
                                        //here createdFile, foundTopic
                                        //37
                                        async.waterfall(
                                            [
                                                function(callback){
                                                    Topic.update({_id:foundTopic._id},{$addToSet:{files:createdFile}}, function(err){
                                                        if(err) {
                                                            console.log("updating topic error-->/n")
                                                            console.log(err);
                                                            //fileUploadError(req,res)
                                                            callback(err);
                                                            
                                                        }else{
                                                            
                                                            callback(null);
                                                            
                                                        }
                                                    });
                                                },
                                                function(callback){
                                                    //here createdFile, foundTopic
                                                    //find chapter
                                                    Chapter.findOne(
                                                        {
                                                            "chapterName":chapterName
                                                        },
                                                        function(err, foundChapter){
                                                            if(err) {
                                                                console.log("finding chapter error-->/n")
                                                                console.log(err);
                                                                //fileUploadError(req,res)
                                                                callback(err)
                                                                
                                                            }
                                                            else{
                                                                if(foundChapter != null){
                                                                    //here createdFile, foundTopic
                                                                    //we found one chapter
                                                                    //60
                                                                    async.waterfall(
                                                                        [
                                                                            function(callback){
                                                                                Chapter.update({_id:foundChapter._id},{$addToSet:{topics:foundTopic}}, function(err){
                                                                                    if(err) {
                                                                                        console.log("updating chapter error-->/n")
                                                                                        console.log(err);
                                                                                        callback(err);
                                                                                        // fileUploadError(req,res)
                                                                                        
                                                                                    }else{
                                                                                        //here createdFile, foundTopic, foundChapter
                                                                                        //find subject
                                                                                        Subject.findOne(
                                                                                            {
                                                                                                "subjectName":subjectName
                                                                                            },
                                                                                            function(err, foundSubject){
                                                                                                if(err) {
                                                                                                    console.log("finding subject error-->/n")
                                                                                                    console.log(err);
                                                                                                //    fileUploadError(req,res)
                                                                                                    callback(err);
                                                                                                    
                                                                                                }
                                                                                                else{
                                                                                                    if(foundSubject != null){
                                                                                                        //here createdFile, foundTopic, foundChapter
                                                                                                        //we found one subject 
                                                                                                        //83
                                                                                                        async.waterfall(
                                                                                                            [
                                                                                                                function(callback){
                                                                                                                    Subject.update({_id:foundSubject._id},{$addToSet:{chapters:foundChapter}}, function(err){
                                                                                                                        if(err) {
                                                                                                                            console.log("updating subject error-->/n")
                                                                                                                            console.log(err);
                                                                                                                            // fileUploadError(req,res)
                                                                                                                            callback(err);
                                                                                                                            
                                                                                                                        }else{
                                                                                                                            //here createdFile, foundTopic, foundChapter, foundSubject
                                                                                                                            //Find class
                                                                                                                            //todo
                                                                                                                            //classStart
                                                                                                                            Class.findOne(
                                                                                                                            {
                                                                                                                                "className":className
                                                                                                                            },
                                                                                                                            function(err, foundClass){
                                                                                                                                if(err) {
                                                                                                                                    console.log("finding class error-->/n")
                                                                                                                                    console.log(err);
                                                                                                                                //    fileUploadError(req,res)
                                                                                                                                    callback(err);
                                                                                                                                    
                                                                                                                                }
                                                                                                                                else{
                                                                                                                                    if(foundClass != null){
                                                                                                                                        //here createdFile, foundTopic, foundChapter, foundSubject
                                                                                                                                        //we found one Class 
                                                                                                                                        async.waterfall(
                                                                                                                                            [
                                                                                                                                                function(callback){
                                                                                                                                                    Class.update({_id:foundClass._id},{$addToSet:{subjects:foundSubject}}, function(err){
                                                                                                                                                        if(err) {
                                                                                                                                                            console.log("updating class error-->/n")
                                                                                                                                                            console.log(err);
                                                                                                                                                            // fileUploadError(req,res)
                                                                                                                                                            callback(err);
                                                                                                                                                            
                                                                                                                                                        }else{
                                                                                                                                                            // here createdFile, foundTopic, foundChapter, foundSubject, foundClass
                                                                                                                                                            // todo
                                                                                                                                                            
                                                                                                                                                            console.log("\ncreatedFile->\n"+createdFile+"\nfoundTopic->\n"+foundTopic+"\nfoundChapter->\n"+foundChapter+"\nfoundSubject->\n"+foundSubject+"\nfoundClass->\n"+foundClass);
                                                                                                                                                            fileUploadSuccess(req,res);
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            ],
                                                                                                                                            function(err, result){
                                                                                                                                                if(err){
                                                                                                                                                    console.log(err);
                                                                                                                                                    fileUploadError(req,res);
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        );
                                                                                                                                    }
                                                                                                                                    else{
                                                                                                                                        //here createdFile, foundTopic, foundChapter, foundSubject
                                                                                                                                        //not found any class, create one
                                                                                                                                        //todos create new class 
                                                                                                                                        async.waterfall(
                                                                                                                                            [
                                                                                                                                                function(callback){
                                                                                                                                                    Class.create(
                                                                                                                                                        {
                                                                                                                                                            "className": className
                                                                                                                                                        },
                                                                                                                                                        function(err, createdClass){
                                                                                                                                                            if(err) {
                                                                                                                                                                console.log("creating class error-->/n")
                                                                                                                                                                console.log(err);
                                                                                                                                                                //fileUploadError(req,res)
                                                                                                                                                                callback(err);
                                                                                                                                                                
                                                                                                                                                            }else{
                                                                                                                                                                callback(null, createdClass);
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    );
                                                                                                                                                },
                                                                                                                                                function(createdClass, callback){
                                                                                                                                                    //here createdFile, foundTopic, foundChapter, foundSubject
                                                                                                                                                    //class created
                                                                                                                                                    //now update class
                                                                                                                                                    Class.update({_id:createdClass._id},{$addToSet:{subjects:foundSubject}}, function(err){
                                                                                                                                                        if(err) {
                                                                                                                                                            console.log("updating class error-->/n")
                                                                                                                                                            console.log(err);
                                                                                                                                                            //fileUploadError(req,res)
                                                                                                                                                            callback(err);
                                                                                                                                                            
                                                                                                                                                        }else{
                                                                                                                                                            //here createdFile, foundTopic, foundChapter, foundSubject, createdClass
                                                                                                                                                            //todo
                                                                                                                                                            console.log("\ncreatedFile->\n"+createdFile+"\nfoundTopic->\n"+foundTopic+"\nfoundChapter->\n"+foundChapter+"\nfoundSubject->\n"+foundSubject+"\ncreatedClass->\n"+createdClass);
                                                                                                                                                            fileUploadSuccess(req,res);
                                                                                                                                                            
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            ],
                                                                                                                                            function(err, result){
                                                                                                                                                if(err){
                                                                                                                                                    console.log(err);
                                                                                                                                                    fileUploadError(req,res);
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        );
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                            );
                                                                                                                            
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                            ],
                                                                                                            function(err, result){
                                                                                                                if(err){
                                                                                                                    console.log(err);
                                                                                                                    fileUploadError(req,res);
                                                                                                                }
                                                                                                            }
                                                                                                        );
                                                                                                    }
                                                                                                    else{
                                                                                                        //here createdFile, foundTopic, foundChapter
                                                                                                        //not found any subject, create one
                                                                                                        //todos create new subject 
                                                                                                        //100
                                                                                                        async.waterfall(
                                                                                                            [
                                                                                                                function(callback){
                                                                                                                    Subject.create(
                                                                                                                        {
                                                                                                                            "subjectName": subjectName
                                                                                                                        },
                                                                                                                        function(err, createdSubject){
                                                                                                                            if(err) {
                                                                                                                                console.log("creating subject error-->/n")
                                                                                                                                console.log(err);
                                                                                                                                //fileUploadError(req,res)
                                                                                                                                callback(err);
                                                                                                                                
                                                                                                                            }else{
                                                                                                                                callback(null, createdSubject);
                                                                                                                            }
                                                                                                                        }
                                                                                                                    );
                                                                                                                },
                                                                                                                function(createdSubject, callback){
                                                                                                                    //here createdFile, foundTopic, foundChapter
                                                                                                                    //subject created
                                                                                                                    //now update subject
                                                                                                                    Subject.update({_id:createdSubject._id},{$addToSet:{chapters:foundChapter}}, function(err){
                                                                                                                        if(err) {
                                                                                                                            console.log("updating subject error-->/n")
                                                                                                                            console.log(err);
                                                                                                                            //fileUploadError(req,res)
                                                                                                                            callback(err);
                                                                                                                            
                                                                                                                        }else{
                                                                                                                            //here createdFile, foundTopic, foundChapter, createdSubject
                                                                                                                            //todo
                                                                                                                            //classStart
                                                                                                                            Class.findOne(
                                                                                                                            {
                                                                                                                                "className":className
                                                                                                                            },
                                                                                                                            function(err, foundClass){
                                                                                                                                if(err) {
                                                                                                                                    console.log("finding class error-->/n")
                                                                                                                                    console.log(err);
                                                                                                                                //    fileUploadError(req,res)
                                                                                                                                    callback(err);
                                                                                                                                    
                                                                                                                                }
                                                                                                                                else{
                                                                                                                                    if(foundClass != null){
                                                                                                                                        //here createdFile, foundTopic, foundChapter, createSubject
                                                                                                                                        //we found one Class 
                                                                                                                                        async.waterfall(
                                                                                                                                            [
                                                                                                                                                function(callback){
                                                                                                                                                    Class.update({_id:foundClass._id},{$addToSet:{subjects:createdSubject}}, function(err){
                                                                                                                                                        if(err) {
                                                                                                                                                            console.log("updating class error-->/n")
                                                                                                                                                            console.log(err);
                                                                                                                                                            // fileUploadError(req,res)
                                                                                                                                                            callback(err);
                                                                                                                                                            
                                                                                                                                                        }else{
                                                                                                                                                            // here createdFile, foundTopic, foundChapter, createdSubject, foundClass
                                                                                                                                                            // todo
                                                                                                                                                            
                                                                                                                                                            console.log("\ncreatedFile->\n"+createdFile+"\nfoundTopic->\n"+foundTopic+"\nfoundChapter->\n"+foundChapter+"\ncreatedSubjectt->\n"+createdSubject+"\nfoundClass->\n"+foundClass);
                                                                                                                                                            fileUploadSuccess(req,res);
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            ],
                                                                                                                                            function(err, result){
                                                                                                                                                if(err){
                                                                                                                                                    console.log(err);
                                                                                                                                                    fileUploadError(req,res);
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        );
                                                                                                                                    }
                                                                                                                                    else{
                                                                                                                                        //here createdFile, foundTopic, foundChapter, createdSubject
                                                                                                                                        //not found any class, create one
                                                                                                                                        //todos create new class 
                                                                                                                                        async.waterfall(
                                                                                                                                            [
                                                                                                                                                function(callback){
                                                                                                                                                    Class.create(
                                                                                                                                                        {
                                                                                                                                                            "className": className
                                                                                                                                                        },
                                                                                                                                                        function(err, createdClass){
                                                                                                                                                            if(err) {
                                                                                                                                                                console.log("creating class error-->/n")
                                                                                                                                                                console.log(err);
                                                                                                                                                                //fileUploadError(req,res)
                                                                                                                                                                callback(err);
                                                                                                                                                                
                                                                                                                                                            }else{
                                                                                                                                                                callback(null, createdClass);
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    );
                                                                                                                                                },
                                                                                                                                                function(createdClass, callback){
                                                                                                                                                    //here createdFile, foundTopic, foundChapter, createdSubject
                                                                                                                                                    //class created
                                                                                                                                                    //now update class
                                                                                                                                                    Class.update({_id:createdClass._id},{$addToSet:{subjects:createdSubject}}, function(err){
                                                                                                                                                        if(err) {
                                                                                                                                                            console.log("updating class error-->/n")
                                                                                                                                                            console.log(err);
                                                                                                                                                            //fileUploadError(req,res)
                                                                                                                                                            callback(err);
                                                                                                                                                            
                                                                                                                                                        }else{
                                                                                                                                                            //here createdFile, foundTopic, foundChapter, createdSubject, createdClass
                                                                                                                                                            //todo
                                                                                                                                                            console.log("\ncreatedFile->\n"+createdFile+"\nfoundTopic->\n"+foundTopic+"\nfoundChapter->\n"+foundChapter+"\ncreatedSubject->\n"+createdSubject+"\ncreatedClass->\n"+createdClass);
                                                                                                                                                            fileUploadSuccess(req,res);
                                                                                                                                                            
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            ],
                                                                                                                                            function(err, result){
                                                                                                                                                if(err){
                                                                                                                                                    console.log(err);
                                                                                                                                                    fileUploadError(req,res);
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        );
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                            );
                                                                                                                            
                                                                                                                            
                                                                                                                        }
                                                                                                                    });
                                                                                                                }
                                                                                                            ],
                                                                                                            function(err, result){
                                                                                                                if(err){
                                                                                                                    console.log(err);
                                                                                                                    fileUploadError(req,res);
                                                                                                                }
                                                                                                            }
                                                                                                        );
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        );
                                                                                    }
                                                                                });
                                                                            }
                                                                        ],
                                                                        function(err, result){
                                                                            if(err){
                                                                                console.log(err);
                                                                                fileUploadError(req,res);
                                                                            }
                                                                        }
                                                                    );
                                                                }
                                                                else{
                                                                    //here createdFile ,foundTopic, not foundChapter 
                                                                    //not found any chapter, create one
                                                                    //create new chapter 
                                                                    //145
                                                                    async.waterfall(
                                                                        [
                                                                            function(callback){
                                                                                Chapter.create(
                                                                                    {
                                                                                        "chapterName": chapterName,
                                                                                        "chapterDescription":"Chapter description"
                                                                                    },
                                                                                    function(err, createdChapter){
                                                                                        if(err) {
                                                                                            console.log("creating chapter error-->/n")
                                                                                            console.log(err);
                                                                                            callback(err);
                                                                                        }else{
                                                                                            callback(null, createdChapter);
                                                                                        }
                                                                                    }
                                                                                );
                                                                            },
                                                                            function(createdChapter, callback){
                                                                                //chapter created
                                                                                //now update chapter
                                                                                Chapter.update({_id:createdChapter._id},{$addToSet:{topics:foundTopic}}, function(err){
                                                                                    if(err) {
                                                                                        console.log("updating chapter error-->/n")
                                                                                        console.log(err);
                                                                                        // fileUploadError(req,res)
                                                                                        callback(err);
                                                                                        
                                                                                    }else{
                                                                                    
                                                                                        callback(null, createdChapter);
                                                                                    }
                                                                                });
                                                                            },
                                                                            function(createdChapter, callback){
                                                                                //here created file, foundTopic, createdChapter
                                                                                //find subject
                                                                                Subject.findOne(
                                                                                    {
                                                                                        "subjectName":subjectName
                                                                                    },
                                                                                    function(err, foundSubject){
                                                                                        if(err) {
                                                                                            console.log("finding subject error-->/n")
                                                                                            console.log(err);
                                                                                            // fileUploadError(req,res)
                                                                                            callback(err);
                                                                                            
                                                                                        }else{
                                                                                            if(foundSubject != null ){
                                                                                                //here createdFile, foundTopic, createdChapter,
                                                                                                //we found one subject
                                                                                                async.waterfall(
                                                                                                    [
                                                                                                        function(callback){
                                                                                                            Subject.update({_id:foundSubject._id},{$addToSet:{chapters:createdChapter}}, function(err){
                                                                                                                if(err) {
                                                                                                                    console.log("updating subject error-->/n")
                                                                                                                    console.log(err);
                                                                                                                    // fileUploadError(req,res)
                                                                                                                    callback(err);
                                                                                                                    
                                                                                                                }else{
                                                                                                                    //here createdFile, foundTopic, createdChapter, foundSubject
                                                                                                                    //todo
                                                                                                                    //classStart
                                                                                                                    Class.findOne(
                                                                                                                    {
                                                                                                                        "className":className
                                                                                                                    },
                                                                                                                    function(err, foundClass){
                                                                                                                        if(err) {
                                                                                                                            console.log("finding class error-->/n")
                                                                                                                            console.log(err);
                                                                                                                        //    fileUploadError(req,res)
                                                                                                                            callback(err);
                                                                                                                            
                                                                                                                        }
                                                                                                                        else{
                                                                                                                            if(foundClass != null){
                                                                                                                                //here createdFile, foundTopic, foundChapter, foundSubject
                                                                                                                                //we found one Class 
                                                                                                                                async.waterfall(
                                                                                                                                    [
                                                                                                                                        function(callback){
                                                                                                                                            Class.update({_id:foundClass._id},{$addToSet:{subjects:foundSubject}}, function(err){
                                                                                                                                                if(err) {
                                                                                                                                                    console.log("updating class error-->/n")
                                                                                                                                                    console.log(err);
                                                                                                                                                    // fileUploadError(req,res)
                                                                                                                                                    callback(err);
                                                                                                                                                    
                                                                                                                                                }else{
                                                                                                                                                    // here createdFile, foundTopic, createdChapter, foundSubject, foundClass
                                                                                                                                                    // todo
                                                                                                                                                    
                                                                                                                                                    console.log("\ncreatedFile->\n"+createdFile+"\nfoundTopic->\n"+foundTopic+"\ncreatedChapter->\n"+createdChapter+"\nfoundSubject->\n"+foundSubject+"\nfoundClass->\n"+foundClass);
                                                                                                                                                    fileUploadSuccess(req,res);
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    ],
                                                                                                                                    function(err, result){
                                                                                                                                        if(err){
                                                                                                                                            console.log(err);
                                                                                                                                            fileUploadError(req,res);
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                );
                                                                                                                            }
                                                                                                                            else{
                                                                                                                                //here createdFile, foundTopic, createdChapter, foundSubject
                                                                                                                                //not found any class, create one
                                                                                                                                //todos create new class 
                                                                                                                                async.waterfall(
                                                                                                                                    [
                                                                                                                                        function(callback){
                                                                                                                                            Class.create(
                                                                                                                                                {
                                                                                                                                                    "className": className
                                                                                                                                                },
                                                                                                                                                function(err, createdClass){
                                                                                                                                                    if(err) {
                                                                                                                                                        console.log("creating class error-->/n")
                                                                                                                                                        console.log(err);
                                                                                                                                                        //fileUploadError(req,res)
                                                                                                                                                        callback(err);
                                                                                                                                                        
                                                                                                                                                    }else{
                                                                                                                                                        callback(null, createdClass);
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            );
                                                                                                                                        },
                                                                                                                                        function(createdClass, callback){
                                                                                                                                            //here createdFile, foundTopic, createdChapter, foundSubject
                                                                                                                                            //class created
                                                                                                                                            //now update class
                                                                                                                                            Class.update({_id:createdClass._id},{$addToSet:{subjects:foundSubject}}, function(err){
                                                                                                                                                if(err) {
                                                                                                                                                    console.log("updating class error-->/n")
                                                                                                                                                    console.log(err);
                                                                                                                                                    //fileUploadError(req,res)
                                                                                                                                                    callback(err);
                                                                                                                                                    
                                                                                                                                                }else{
                                                                                                                                                    //here createdFile, foundTopic, createdChapter, foundSubject, createdClass
                                                                                                                                                    //todo
                                                                                                                                                    console.log("\ncreatedFile->\n"+createdFile+"\nfoundTopic->\n"+foundTopic+"\ncreatedChapter->\n"+createdChapter+"\nfoundSubject->\n"+foundSubject+"\ncreatedClass->\n"+createdClass);
                                                                                                                                                    fileUploadSuccess(req,res);
                                                                                                                                                    
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    ],
                                                                                                                                    function(err, result){
                                                                                                                                        if(err){
                                                                                                                                            console.log(err);
                                                                                                                                            fileUploadError(req,res);
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                );
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                    );
                                                                                                                    
                                                                                                                    
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    ],
                                                                                                    function(err, result){
                                                                                                        if(err){
                                                                                                            console.log(err);
                                                                                                            fileUploadError(req,res);
                                                                                                        }
                                                                                                    }
                                                                                                );
                                                                                            }
                                                                                            else{
                                                                                                //here createdFile, foundTopic, createdChapter
                                                                                                //not found any subject, create one
                                                                                                //todos create new subject 
                                                                                                async.waterfall(
                                                                                                    [
                                                                                                        function(callback){
                                                                                                            Subject.create(
                                                                                                                {
                                                                                                                    "subjectName": subjectName
                                                                                                                },
                                                                                                                function(err, createdSubject){
                                                                                                                    if(err) {
                                                                                                                        console.log("creating subject error-->/n")
                                                                                                                        console.log(err);
                                                                                                                        // fileUploadError(req,res)
                                                                                                                        callback(err);
                                                                                                                        
                                                                                                                    }else{
                                                                                                                        callback(null, createdSubject);
                                                                                                                    }
                                                                                                                }
                                                                                                            );
                                                                                                        },
                                                                                                        function(createdSubject, callback){
                                                                                                            //here createdFile, foundTopic, createdChapter
                                                                                                            //subject created
                                                                                                            //now update subject
                                                                                                            Subject.update({_id:createdSubject._id},{$addToSet:{chapters:createdChapter}}, function(err){
                                                                                                                if(err) {
                                                                                                                    console.log("updating subject error-->/n")
                                                                                                                    console.log(err);
                                                                                                                    // fileUploadError(req,res)
                                                                                                                    callback(err);
                                                                                                                    
                                                                                                                }else{
                                                                                                                    //here createdFile, foundTopic, createdChapter, createdSubject
                                                                                                                    //todo
                                                                                                                    //classStart
                                                                                                                            Class.findOne(
                                                                                                                            {
                                                                                                                                "className":className
                                                                                                                            },
                                                                                                                            function(err, foundClass){
                                                                                                                                if(err) {
                                                                                                                                    console.log("finding class error-->/n")
                                                                                                                                    console.log(err);
                                                                                                                                //    fileUploadError(req,res)
                                                                                                                                    callback(err);
                                                                                                                                    
                                                                                                                                }
                                                                                                                                else{
                                                                                                                                    if(foundClass != null){
                                                                                                                                        //here createdFile, foundTopic, createdChapter, createSubject
                                                                                                                                        //we found one Class 
                                                                                                                                        async.waterfall(
                                                                                                                                            [
                                                                                                                                                function(callback){
                                                                                                                                                    Class.update({_id:foundClass._id},{$addToSet:{subjects:createdSubject}}, function(err){
                                                                                                                                                        if(err) {
                                                                                                                                                            console.log("updating class error-->/n")
                                                                                                                                                            console.log(err);
                                                                                                                                                            // fileUploadError(req,res)
                                                                                                                                                            callback(err);
                                                                                                                                                            
                                                                                                                                                        }else{
                                                                                                                                                            // here createdFile, foundTopic, createdChapter, createdSubject, foundClass
                                                                                                                                                            // todo
                                                                                                                                                            
                                                                                                                                                            console.log("\ncreatedFile->\n"+createdFile+"\nfoundTopic->\n"+foundTopic+"\ncreatedChapter->\n"+createdChapter+"\ncreatedSubjectt->\n"+createdSubject+"\nfoundClass->\n"+foundClass);
                                                                                                                                                            fileUploadSuccess(req,res);
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            ],
                                                                                                                                            function(err, result){
                                                                                                                                                if(err){
                                                                                                                                                    console.log(err);
                                                                                                                                                    fileUploadError(req,res);
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        );
                                                                                                                                    }
                                                                                                                                    else{
                                                                                                                                        //here createdFile, foundTopic, createdChapter, createdSubject
                                                                                                                                        //not found any class, create one
                                                                                                                                        //todos create new class 
                                                                                                                                        async.waterfall(
                                                                                                                                            [
                                                                                                                                                function(callback){
                                                                                                                                                    Class.create(
                                                                                                                                                        {
                                                                                                                                                            "className": className
                                                                                                                                                        },
                                                                                                                                                        function(err, createdClass){
                                                                                                                                                            if(err) {
                                                                                                                                                                console.log("creating class error-->/n")
                                                                                                                                                                console.log(err);
                                                                                                                                                                //fileUploadError(req,res)
                                                                                                                                                                callback(err);
                                                                                                                                                                
                                                                                                                                                            }else{
                                                                                                                                                                callback(null, createdClass);
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    );
                                                                                                                                                },
                                                                                                                                                function(createdClass, callback){
                                                                                                                                                    //here createdFile, foundTopic, createdChapter, createdSubject
                                                                                                                                                    //class created
                                                                                                                                                    //now update class
                                                                                                                                                    Class.update({_id:createdClass._id},{$addToSet:{subjects:createdSubject}}, function(err){
                                                                                                                                                        if(err) {
                                                                                                                                                            console.log("updating class error-->/n")
                                                                                                                                                            console.log(err);
                                                                                                                                                            //fileUploadError(req,res)
                                                                                                                                                            callback(err);
                                                                                                                                                            
                                                                                                                                                        }else{
                                                                                                                                                            //here createdFile, foundTopic, createdChapter, createdSubject, createdClass
                                                                                                                                                            //todo
                                                                                                                                                            console.log("\ncreatedFile->\n"+createdFile+"\nfoundTopic->\n"+foundTopic+"\ncreatedChapter->\n"+createdChapter+"\ncreatedSubject->\n"+createdSubject+"\ncreatedClass->\n"+createdClass);
                                                                                                                                                            fileUploadSuccess(req,res);
                                                                                                                                                            
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            ],
                                                                                                                                            function(err, result){
                                                                                                                                                if(err){
                                                                                                                                                    console.log(err);
                                                                                                                                                    fileUploadError(req,res);
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        );
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                            );
                                                                                                                   
                                                                                                                    
                                                                                                                    
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    ],
                                                                                                    function(err, result){
                                                                                                        if(err){
                                                                                                            console.log(err);
                                                                                                            fileUploadError(req,res);
                                                                                                        }
                                                                                                    }
                                                                                                );

                                                                                            }
                                                                                        }
                                                                                    }
                                                                                );
                                                                            }
                                                                        ],
                                                                        function(err, result){
                                                                            if(err){
                                                                                console.log(err);
                                                                                fileUploadError(req,res);
                                                                            }
                                                                        }
                                                                    );
                                                                }
                                                            }
                                                        }
                                                    );
                                                }
                                            ], 
                                            function(err, result){
                                                if(err){
                                                    console.log(err);
                                                    fileUploadError(req,res);
                                                }
                                            }
                                        );
                                    }else{
                                        //here createdFile, not foundTopic
                                        //not found any topic, create one
                                        //create new topic 
                                        //252
                                        async.waterfall(
                                            [
                                                function(callback){
                                                    Topic.create(
                                                        {
                                                            "topicName": topicName,
                                                            "topicDescription":"Topic description"
                                                        },
                                                        function(err, createdTopic){
                                                            if(err) {
                                                                console.log("creating topic error-->/n")
                                                                console.log(err);
                                                                // fileUploadError(req,res)
                                                                callback(err);
                                                                
                                                            }else{
                                                                callback(null, createdTopic);
                                                            }
                                                        }
                                                    );
                                                },
                                                function(createdTopic, callback){
                                                    //topic created
                                                    //now update topic
                                                    Topic.update({_id:createdTopic._id},{$addToSet:{files:createdFile}}, function(err){
                                                        if(err) {
                                                            console.log("updating topic error-->/n")
                                                            console.log(err);
                                                            // fileUploadError(req,res)
                                                            callback(err);
                                                            
                                                        }else{
                                                            
                                                            callback(null, createdTopic);
                                                        }
                                                    });
                                                },
                                                function(createdTopic, callback){
                                                    //here created file, createdTopic
                                                    //find chapter
                                                    Chapter.findOne(
                                                        {
                                                            "chapterName":chapterName
                                                        },
                                                        function(err, foundChapter){
                                                            if(err) {
                                                                console.log("finding chapter error-->/n")
                                                                console.log(err);
                                                                // fileUploadError(req,res)
                                                                callback(err);
                                                                
                                                            }else{
                                                                if(foundChapter != null ){
                                                                    async.waterfall(
                                                                        [
                                                                            function(callback){
                                                                                Chapter.update({_id:foundChapter._id},{$addToSet:{topics:createdTopic}}, function(err){
                                                                                    if(err) {
                                                                                        console.log("updating chapter error-->/n")
                                                                                        console.log(err);
                                                                                        // fileUploadError(req,res)
                                                                                        callback(err);
                                                                                        
                                                                                    }else{
                                                                                        callback(null);
                                                                                    }
                                                                                });
                                                                            },
                                                                            function(callback){
                                                                                //here createdFile, createdTopic, foundChapter
                                                                                //find subject
                                                                                Subject.findOne(
                                                                                    {
                                                                                        "subjectName":subjectName
                                                                                    },
                                                                                    function(err, foundSubject){
                                                                                        if(err) {
                                                                                            console.log("finding subject error-->/n")
                                                                                            console.log(err);
                                                                                            callback(err);
                                                                                        }else{
                                                                                            if(foundSubject != null ){
                                                                                                //here createdFile, createdTopic, foundChapter
                                                                                                //we found one subject 
                                                                                                async.waterfall(
                                                                                                    [
                                                                                                        function(callback){
                                                                                                            Subject.update({_id:foundSubject._id},{$addToSet:{chapters:foundChapter}}, function(err){
                                                                                                                if(err) {
                                                                                                                    console.log("updating subject error-->/n")
                                                                                                                    console.log(err);
                                                                                                                    // fileUploadError(req,res)
                                                                                                                    callback(err);
                                                                                                                    
                                                                                                                }else{
                                                                                                                    //here createdFile, createdTopic, foundChapter, foundSubject
                                                                                                                    //todo
                                                                                                                    //classStart
                                                                                                                    Class.findOne(
                                                                                                                    {
                                                                                                                        "className":className
                                                                                                                    },
                                                                                                                    function(err, foundClass){
                                                                                                                        if(err) {
                                                                                                                            console.log("finding class error-->/n")
                                                                                                                            console.log(err);
                                                                                                                        //    fileUploadError(req,res)
                                                                                                                            callback(err);
                                                                                                                            
                                                                                                                        }
                                                                                                                        else{
                                                                                                                            if(foundClass != null){
                                                                                                                                //here createdFile, createdTopic, foundChapter, foundSubject
                                                                                                                                //we found one Class 
                                                                                                                                async.waterfall(
                                                                                                                                    [
                                                                                                                                        function(callback){
                                                                                                                                            Class.update({_id:foundClass._id},{$addToSet:{subjects:foundSubject}}, function(err){
                                                                                                                                                if(err) {
                                                                                                                                                    console.log("updating class error-->/n")
                                                                                                                                                    console.log(err);
                                                                                                                                                    // fileUploadError(req,res)
                                                                                                                                                    callback(err);
                                                                                                                                                    
                                                                                                                                                }else{
                                                                                                                                                    // here createdFile, createdTopic, foundChapter, foundSubject, foundClass
                                                                                                                                                    // todo
                                                                                                                                                    
                                                                                                                                                    console.log("\ncreatedFile->\n"+createdFile+"\ncreatedTopic->\n"+createdTopic+"\nfoundChapter->\n"+foundChapter+"\nfoundSubject->\n"+foundSubject+"\nfoundClass->\n"+foundClass);
                                                                                                                                                    fileUploadSuccess(req,res);
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    ],
                                                                                                                                    function(err, result){
                                                                                                                                        if(err){
                                                                                                                                            console.log(err);
                                                                                                                                            fileUploadError(req,res);
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                );
                                                                                                                            }
                                                                                                                            else{
                                                                                                                                //here createdFile, createdTopic, foundChapter, foundSubject
                                                                                                                                //not found any class, create one
                                                                                                                                //todos create new class 
                                                                                                                                async.waterfall(
                                                                                                                                    [
                                                                                                                                        function(callback){
                                                                                                                                            Class.create(
                                                                                                                                                {
                                                                                                                                                    "className": className
                                                                                                                                                },
                                                                                                                                                function(err, createdClass){
                                                                                                                                                    if(err) {
                                                                                                                                                        console.log("creating class error-->/n")
                                                                                                                                                        console.log(err);
                                                                                                                                                        //fileUploadError(req,res)
                                                                                                                                                        callback(err);
                                                                                                                                                        
                                                                                                                                                    }else{
                                                                                                                                                        callback(null, createdClass);
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            );
                                                                                                                                        },
                                                                                                                                        function(createdClass, callback){
                                                                                                                                            //here createdFile, createdTopic, foundChapter, foundSubject
                                                                                                                                            //class created
                                                                                                                                            //now update class
                                                                                                                                            Class.update({_id:createdClass._id},{$addToSet:{subjects:foundSubject}}, function(err){
                                                                                                                                                if(err) {
                                                                                                                                                    console.log("updating class error-->/n")
                                                                                                                                                    console.log(err);
                                                                                                                                                    //fileUploadError(req,res)
                                                                                                                                                    callback(err);
                                                                                                                                                    
                                                                                                                                                }else{
                                                                                                                                                    //here createdFile, createdTopic, foundChapter, foundSubject, createdClass
                                                                                                                                                    //todo
                                                                                                                                                    console.log("\ncreatedFile->\n"+createdFile+"\ncreatedTopic->\n"+createdTopic+"\nfoundChapter->\n"+foundChapter+"\nfoundSubject->\n"+foundSubject+"\ncreatedClass->\n"+createdClass);
                                                                                                                                                    fileUploadSuccess(req,res);
                                                                                                                                                    
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    ],
                                                                                                                                    function(err, result){
                                                                                                                                        if(err){
                                                                                                                                            console.log(err);
                                                                                                                                            fileUploadError(req,res);
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                );
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                    );
                                                                                                                    
                                                                                                                    
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    ],
                                                                                                    function(err, result){
                                                                                                        if(err){
                                                                                                            console.log(err);
                                                                                                            fileUploadError(req,res);
                                                                                                        }
                                                                                                    }
                                                                                            );
                                                                                            }else{
                                                                                                //here createdFile, createdTopic, foundChapter
                                                                                                //not found any subject, create one
                                                                                                //todos create new subject
                                                                                                //329
                                                                                                async.waterfall(
                                                                                                    [
                                                                                                        function(callback){
                                                                                                            Subject.create(
                                                                                                                {
                                                                                                                    "subjectName": subjectName
                                                                                                                },
                                                                                                                function(err, createdSubject){
                                                                                                                    if(err) {
                                                                                                                        console.log("creating subject error-->/n")
                                                                                                                        console.log(err);
                                                                                                                        // fileUploadError(req,res)
                                                                                                                        callback(err);
                                                                                                                        
                                                                                                                    }else{
                                                                                                                        callback(null, createdSubject);
                                                                                                                    }
                                                                                                            });
                                                                                                        },
                                                                                                        function(createdSubject, callback){
                                                                                                            //here createdFile, createdTopic, foundChapter
                                                                                                            //subject created
                                                                                                            //now update subject
                                                                                                            Subject.update({_id:createdSubject._id},{$addToSet:{chapters:foundChapter}}, function(err){
                                                                                                                if(err) {
                                                                                                                    console.log("updating subject error-->/n")
                                                                                                                    console.log(err);
                                                                                                                    // fileUploadError(req,res)
                                                                                                                    callback(err);
                                                                                                                    
                                                                                                                }else{
                                                                                                                    //here createdFile, createdTopic, foundChapter, createdSubject
                                                                                                                    //todo
                                                                                                                    //classStart
                                                                                                                            Class.findOne(
                                                                                                                            {
                                                                                                                                "className":className
                                                                                                                            },
                                                                                                                            function(err, foundClass){
                                                                                                                                if(err) {
                                                                                                                                    console.log("finding class error-->/n")
                                                                                                                                    console.log(err);
                                                                                                                                //    fileUploadError(req,res)
                                                                                                                                    callback(err);
                                                                                                                                    
                                                                                                                                }
                                                                                                                                else{
                                                                                                                                    if(foundClass != null){
                                                                                                                                        //here createdFile, createdTopic, foundChapter, createSubject
                                                                                                                                        //we found one Class 
                                                                                                                                        async.waterfall(
                                                                                                                                            [
                                                                                                                                                function(callback){
                                                                                                                                                    Class.update({_id:foundClass._id},{$addToSet:{subjects:createdSubject}}, function(err){
                                                                                                                                                        if(err) {
                                                                                                                                                            console.log("updating class error-->/n")
                                                                                                                                                            console.log(err);
                                                                                                                                                            // fileUploadError(req,res)
                                                                                                                                                            callback(err);
                                                                                                                                                            
                                                                                                                                                        }else{
                                                                                                                                                            // here createdFile, createdTopic, foundChapter, createdSubject, foundClass
                                                                                                                                                            // todo
                                                                                                                                                            
                                                                                                                                                            console.log("\ncreatedFile->\n"+createdFile+"\ncreatedTopicc->\n"+createdTopic+"\nfoundChapter->\n"+foundChapter+"\ncreatedSubjectt->\n"+createdSubject+"\nfoundClass->\n"+foundClass);
                                                                                                                                                            fileUploadSuccess(req,res);
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            ],
                                                                                                                                            function(err, result){
                                                                                                                                                if(err){
                                                                                                                                                    console.log(err);
                                                                                                                                                    fileUploadError(req,res);
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        );
                                                                                                                                    }
                                                                                                                                    else{
                                                                                                                                        //here createdFile, createdTopic, foundChapter, createdSubject
                                                                                                                                        //not found any class, create one
                                                                                                                                        //todos create new class 
                                                                                                                                        async.waterfall(
                                                                                                                                            [
                                                                                                                                                function(callback){
                                                                                                                                                    Class.create(
                                                                                                                                                        {
                                                                                                                                                            "className": className
                                                                                                                                                        },
                                                                                                                                                        function(err, createdClass){
                                                                                                                                                            if(err) {
                                                                                                                                                                console.log("creating class error-->/n")
                                                                                                                                                                console.log(err);
                                                                                                                                                                //fileUploadError(req,res)
                                                                                                                                                                callback(err);
                                                                                                                                                                
                                                                                                                                                            }else{
                                                                                                                                                                callback(null, createdClass);
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    );
                                                                                                                                                },
                                                                                                                                                function(createdClass, callback){
                                                                                                                                                    //here createdFile, createdTopic, foundChapter, createdSubject
                                                                                                                                                    //class created
                                                                                                                                                    //now update class
                                                                                                                                                    Class.update({_id:createdClass._id},{$addToSet:{subjects:createdSubject}}, function(err){
                                                                                                                                                        if(err) {
                                                                                                                                                            console.log("updating class error-->/n")
                                                                                                                                                            console.log(err);
                                                                                                                                                            //fileUploadError(req,res)
                                                                                                                                                            callback(err);
                                                                                                                                                            
                                                                                                                                                        }else{
                                                                                                                                                            //here createdFile, createdTopic, foundChapter, createdSubject, createdClass
                                                                                                                                                            //todo
                                                                                                                                                            console.log("\ncreatedFile->\n"+createdFile+"\ncreatedTopic->\n"+createdTopic+"\nfoundChapter->\n"+foundChapter+"\ncreatedSubject->\n"+createdSubject+"\ncreatedClass->\n"+createdClass);
                                                                                                                                                            fileUploadSuccess(req,res);
                                                                                                                                                            
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            ],
                                                                                                                                            function(err, result){
                                                                                                                                                if(err){
                                                                                                                                                    console.log(err);
                                                                                                                                                    fileUploadError(req,res);
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        );
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                            );
                                                                                                                    
                                                                                                                    
                                                                                                                    
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    ],
                                                                                                    function(err, result){
                                                                                                        if(err){
                                                                                                            console.log(err);
                                                                                                            fileUploadError(req,res);
                                                                                                        }
                                                                                                    }
                                                                                                );
                                                                                            }
                                                                                        }
                                                                                });
                                                                            }
                                                                        ],
                                                                        function(err, result){
                                                                            if(err){
                                                                                console.log(err);
                                                                                fileUploadError(req,res);
                                                                            }
                                                                        }
                                                                    );
                                                                }
                                                                else{
                                                                    //here createdFile, createdTopic, not foundChapter
                                                                    //not found any chapter, create one
                                                                    //create new chapter 
                                                                    //374
                                                                    async.waterfall(
                                                                        [
                                                                            function(callback){
                                                                                Chapter.create(
                                                                                    {
                                                                                        "chapterName": chapterName,
                                                                                        "chapterDescription":"Chapter description"
                                                                                    },
                                                                                    function(err, createdChapter){
                                                                                        if(err) {
                                                                                            console.log("creating chapter error-->/n")
                                                                                            console.log(err);
                                                                                            // fileUploadError(req,res)
                                                                                            callback(err);
                                                                                            
                                                                                        }else{
                                                                                            callback(null, createdChapter);
                                                                                        }
                                                                                });
                                                                            },
                                                                            function(createdChapter, callback){
                                                                                //here createdFile, createdTopic, createdChapter
                                                                                //chapter created
                                                                                //now update chapter
                                                                                Chapter.update({_id:createdChapter._id},{$addToSet:{topics:createdTopic}}, function(err){
                                                                                    if(err) {
                                                                                        console.log("updating chapter error-->/n")
                                                                                        console.log(err);
                                                                                        // fileUploadError(req,res)
                                                                                        callback(err);
                                                                                        
                                                                                    }else{
                                                                                        callback(null, createdChapter);
                                                                                    }
                                                                                });
                                                                            },
                                                                            function(createdChapter, callback){
                                                                                Subject.findOne(
                                                                                    {
                                                                                        "subjectName":subjectName
                                                                                    },
                                                                                    function(err, foundSubject){
                                                                                        if(err) {
                                                                                            console.log("finding subject error-->/n")
                                                                                            console.log(err);
                                                                                            // fileUploadError(req,res)
                                                                                            callback(err);
                                                                                            
                                                                                        }else{
                                                                                            if(foundSubject != null ){
                                                                                                //here createdFile, createdTopic, createdChapter
                                                                                                //we found one subject
                                                                                                async.waterfall(
                                                                                                    [
                                                                                                        function(callback){
                                                                                                            Subject.update({_id:foundSubject._id},{$addToSet:{chapters:createdChapter}}, function(err){
                                                                                                                if(err) {
                                                                                                                    console.log("updating subject error-->/n")
                                                                                                                    console.log(err);
                                                                                                                    // fileUploadError(req,res)
                                                                                                                    callback(err);
                                                                                                                    
                                                                                                                }else{
                                                                                                                    //here createdFile, createdTopic, createdChapter, foundSubject
                                                                                                                    //todo
                                                                                                                    //classStart
                                                                                                                    Class.findOne(
                                                                                                                    {
                                                                                                                        "className":className
                                                                                                                    },
                                                                                                                    function(err, foundClass){
                                                                                                                        if(err) {
                                                                                                                            console.log("finding class error-->/n")
                                                                                                                            console.log(err);
                                                                                                                        //    fileUploadError(req,res)
                                                                                                                            callback(err);
                                                                                                                            
                                                                                                                        }
                                                                                                                        else{
                                                                                                                            if(foundClass != null){
                                                                                                                                //here createdFile, createTopic, createdChapter, foundSubject
                                                                                                                                //we found one Class 
                                                                                                                                async.waterfall(
                                                                                                                                    [
                                                                                                                                        function(callback){
                                                                                                                                            Class.update({_id:foundClass._id},{$addToSet:{subjects:foundSubject}}, function(err){
                                                                                                                                                if(err) {
                                                                                                                                                    console.log("updating class error-->/n")
                                                                                                                                                    console.log(err);
                                                                                                                                                    // fileUploadError(req,res)
                                                                                                                                                    callback(err);
                                                                                                                                                    
                                                                                                                                                }else{
                                                                                                                                                    // here createdFile, createTopic, createdChapter, foundSubject, foundClass
                                                                                                                                                    // todo
                                                                                                                                                    
                                                                                                                                                    console.log("\ncreatedFile->\n"+createdFile+"\ncreatedTopic->\n"+createTopic+"\ncreatedChapter->\n"+createdChapter+"\nfoundSubject->\n"+foundSubject+"\nfoundClass->\n"+foundClass);
                                                                                                                                                    fileUploadSuccess(req,res);
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    ],
                                                                                                                                    function(err, result){
                                                                                                                                        if(err){
                                                                                                                                            console.log(err);
                                                                                                                                            fileUploadError(req,res);
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                );
                                                                                                                            }
                                                                                                                            else{
                                                                                                                                //here createdFile, createdTopic, createdChapter, foundSubject
                                                                                                                                //not found any class, create one
                                                                                                                                //todos create new class 
                                                                                                                                async.waterfall(
                                                                                                                                    [
                                                                                                                                        function(callback){
                                                                                                                                            Class.create(
                                                                                                                                                {
                                                                                                                                                    "className": className
                                                                                                                                                },
                                                                                                                                                function(err, createdClass){
                                                                                                                                                    if(err) {
                                                                                                                                                        console.log("creating class error-->/n")
                                                                                                                                                        console.log(err);
                                                                                                                                                        //fileUploadError(req,res)
                                                                                                                                                        callback(err);
                                                                                                                                                        
                                                                                                                                                    }else{
                                                                                                                                                        callback(null, createdClass);
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            );
                                                                                                                                        },
                                                                                                                                        function(createdClass, callback){
                                                                                                                                            //here createdFile, createdTopic, createdChapter, foundSubject
                                                                                                                                            //class created
                                                                                                                                            //now update class
                                                                                                                                            Class.update({_id:createdClass._id},{$addToSet:{subjects:foundSubject}}, function(err){
                                                                                                                                                if(err) {
                                                                                                                                                    console.log("updating class error-->/n")
                                                                                                                                                    console.log(err);
                                                                                                                                                    //fileUploadError(req,res)
                                                                                                                                                    callback(err);
                                                                                                                                                    
                                                                                                                                                }else{
                                                                                                                                                    //here createdFile, createdTopic, createdChapter, foundSubject, createdClass
                                                                                                                                                    //todo
                                                                                                                                                    console.log("\ncreatedFile->\n"+createdFile+"\ncreatedTopic->\n"+createdTopic+"\ncreatedChapter->\n"+createdChapter+"\nfoundSubject->\n"+foundSubject+"\ncreatedClass->\n"+createdClass);
                                                                                                                                                    fileUploadSuccess(req,res);
                                                                                                                                                    
                                                                                                                                                }
                                                                                                                                            });
                                                                                                                                        }
                                                                                                                                    ],
                                                                                                                                    function(err, result){
                                                                                                                                        if(err){
                                                                                                                                            console.log(err);
                                                                                                                                            fileUploadError(req,res);
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                );
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                    );
                                                                                                                    
                                                                                                                    
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    ],
                                                                                                    function(err, result){
                                                                                                        if(err){
                                                                                                            console.log(err);
                                                                                                            fileUploadError(req,res);
                                                                                                        }
                                                                                                    }
                                                                                                );
                                                                                            }else{
                                                                                                //here createdFile, createdTopic, createdChapter
                                                                                                //not found any subject, create one
                                                                                                //todos create new subject 
                                                                                                //431
                                                                                                async.waterfall(
                                                                                                    [
                                                                                                        function(callback){
                                                                                                            Subject.create(
                                                                                                                {
                                                                                                                    "subjectName": subjectName
                                                                                                                },
                                                                                                                function(err, createdSubject){
                                                                                                                    if(err) {
                                                                                                                        console.log("creating subject error-->/n")
                                                                                                                        console.log(err);
                                                                                                                        // fileUploadError(req,res)
                                                                                                                        callback(err);

                                                                                                                    }else{
                                                                                                                        callback(null, createdSubject);
                                                                                                                    }
                                                                                                            });
                                                                                                        },
                                                                                                        function(createdSubject, callback){
                                                                                                            //here createdFile, createdTopic, createdChapter
                                                                                                            //subject created
                                                                                                            //now update subject
                                                                                                            Subject.update({_id:createdSubject._id},{$addToSet:{chapters:createdChapter}}, function(err){
                                                                                                                if(err) {
                                                                                                                    console.log("updating subject error-->/n")
                                                                                                                    console.log(err);
                                                                                                                    // fileUploadError(req,res)
                                                                                                                    callback(err);
                                                                                                                    
                                                                                                                }else{
                                                                                                                    //here createdFile, createdTopic, createdChapter, createdSubject
                                                                                                                    //todo
                                                                                                                    //classStart
                                                                                                                            Class.findOne(
                                                                                                                            {
                                                                                                                                "className":className
                                                                                                                            },
                                                                                                                            function(err, foundClass){
                                                                                                                                if(err) {
                                                                                                                                    console.log("finding class error-->/n")
                                                                                                                                    console.log(err);
                                                                                                                                //    fileUploadError(req,res)
                                                                                                                                    callback(err);
                                                                                                                                    
                                                                                                                                }
                                                                                                                                else{
                                                                                                                                    if(foundClass != null){
                                                                                                                                        //here createdFile, createdTopic, createdChapter, createSubject
                                                                                                                                        //we found one Class 
                                                                                                                                        async.waterfall(
                                                                                                                                            [
                                                                                                                                                function(callback){
                                                                                                                                                    Class.update({_id:foundClass._id},{$addToSet:{subjects:createdSubject}}, function(err){
                                                                                                                                                        if(err) {
                                                                                                                                                            console.log("updating class error-->/n")
                                                                                                                                                            console.log(err);
                                                                                                                                                            // fileUploadError(req,res)
                                                                                                                                                            callback(err);
                                                                                                                                                            
                                                                                                                                                        }else{
                                                                                                                                                            // here createdFile, createdTopic, createdChapter, createdSubject, foundClass
                                                                                                                                                            // todo
                                                                                                                                                            
                                                                                                                                                            console.log("\ncreatedFile->\n"+createdFile+"\ncreatedTopic->\n"+createdTopic+"\ncreatedChapter->\n"+createdChapter+"\ncreatedSubjectt->\n"+createdSubject+"\nfoundClass->\n"+foundClass);
                                                                                                                                                            fileUploadSuccess(req,res);
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            ],
                                                                                                                                            function(err, result){
                                                                                                                                                if(err){
                                                                                                                                                    console.log(err);
                                                                                                                                                    fileUploadError(req,res);
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        );
                                                                                                                                    }
                                                                                                                                    else{
                                                                                                                                        //here createdFile, createdTopic, createdChapter, createdSubject
                                                                                                                                        //not found any class, create one
                                                                                                                                        //todos create new class 
                                                                                                                                        async.waterfall(
                                                                                                                                            [
                                                                                                                                                function(callback){
                                                                                                                                                    Class.create(
                                                                                                                                                        {
                                                                                                                                                            "className": className
                                                                                                                                                        },
                                                                                                                                                        function(err, createdClass){
                                                                                                                                                            if(err) {
                                                                                                                                                                console.log("creating class error-->/n")
                                                                                                                                                                console.log(err);
                                                                                                                                                                //fileUploadError(req,res)
                                                                                                                                                                callback(err);
                                                                                                                                                                
                                                                                                                                                            }else{
                                                                                                                                                                callback(null, createdClass);
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    );
                                                                                                                                                },
                                                                                                                                                function(createdClass, callback){
                                                                                                                                                    //here createdFile, createdTopic, createdChapter, createdSubject
                                                                                                                                                    //class created
                                                                                                                                                    //now update class
                                                                                                                                                    Class.update({_id:createdClass._id},{$addToSet:{subjects:createdSubject}}, function(err){
                                                                                                                                                        if(err) {
                                                                                                                                                            console.log("updating class error-->/n")
                                                                                                                                                            console.log(err);
                                                                                                                                                            //fileUploadError(req,res)
                                                                                                                                                            callback(err);
                                                                                                                                                            
                                                                                                                                                        }else{
                                                                                                                                                            //here createdFile, createdTopic, createdChapter, createdSubject, createdClass
                                                                                                                                                            //todo
                                                                                                                                                            console.log("\ncreatedFile->\n"+createdFile+"\ncreatedTopic->\n"+createdTopic+"\ncreatedChapter->\n"+createdChapter+"\ncreatedSubject->\n"+createdSubject+"\ncreatedClass->\n"+createdClass);
                                                                                                                                                            fileUploadSuccess(req,res);
                                                                                                                                                            
                                                                                                                                                        }
                                                                                                                                                    });
                                                                                                                                                }
                                                                                                                                            ],
                                                                                                                                            function(err, result){
                                                                                                                                                if(err){
                                                                                                                                                    console.log(err);
                                                                                                                                                    fileUploadError(req,res);
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        );
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                            );
                                                                                                                    
                                                                                                                    
                                                                                                                    
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    ],
                                                                                                    function(err, result){
                                                                                                        if(err){
                                                                                                            console.log(err);
                                                                                                            fileUploadError(req,res);
                                                                                                        }
                                                                                                    }
                                                                                                );
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                );
                                                                            }
                                                                        ],
                                                                        function(err, result){
                                                                            if(err){
                                                                                console.log(err);
                                                                                fileUploadError(req,res);
                                                                            }
                                                                        }
                                                                    );
                                                                }
                                                            }
                                                        }
                                                    );
                                                }
                                            ], 
                                            function(err, result){
                                                if(err){
                                                    console.log(err);
                                                    fileUploadError(req,res);
                                                }
                                            }
                                        );
                                    }
                                }
                            }

                    );
                }
            ],
            function(err, result){
                if(err){
                    console.log(err);
                    fileUploadError(req,res);
                }
            }
        );

	})
});

module.exports = router;