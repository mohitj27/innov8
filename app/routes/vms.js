const express = require("express");
const fs = require("fs");
const moment = require("moment-timezone");
const errors = require("../error");
const errorHandler = require("../errorHandler");
const middleware = require("../middleware");
const mongoose = require("mongoose");
const Gallery = require("./../models/Gallery");
const Course = require("./../models/Course");
const Visitor = require("./../models/Visitor");
const Blog = require("./../models/Blog");
const Link = require("./../models/Link");
const vmsController = require("./../controllers/vms.controller");
const linkController = require("./../controllers/link.controller");
const courseController = require("./../controllers/courses.controller");
const forumController = require("./../controllers/forum.controller");
const videoController = require("./../controllers/video.controller");
const validator = require("validator");
const router = express.Router();
Promise = require("bluebird");
mongoose.Promise = Promise;

router.get("/test", (req, res, next) => {
  res.render("testGallery");
});

router.get("/harvest", (req, res, next) => {
  res.render("harvest");
});

router.get("/", (req, res) => {
  Blog.find({ publish: "on" })
    .sort({ views: -1 })
    .limit(3)
    .then(foundPopularBlogs => {
      Course.find({})
        .then(foundCourses => {
          res.render("HomePage", {
            foundPopularBlogs,
            foundCourses
          })
        });
    }).catch(err => next(err))
});

router.get("/vms/phone/:phone", async (req, res, next) => {
  const phone = req.params.phone || "";
  if (!phone || validator.isEmpty(phone)) {
    return errorHandler.errorResponse("INVALID_FIELD", "phone", next);
  }

  try {
    const foundVisitor = await vmsController.findVisitorByPhone(phone);
    res.json(foundVisitor);
  } catch (err) {
    next(err || "Internal Server Error");
  }
});

router.get("/vms", middleware.isLoggedIn, (req, res) => {
  res.render("newVisitor");
});

router.get("/mdis", (req, res) => {
  res.render("mdis");
});

router.post(
  "/vms",
  middleware.isLoggedIn,
  middleware.isCentreOrAdmin,
  (req, res, next) => {
    // console.log('body', req.body)
    const name = req.body.name;
    const phone = req.body.phone || "";
    const emailId = req.body.emailId || "";
    const classs = req.body.classs || "";
    const date = moment(Date.now())
      .tz("Asia/Kolkata")
      .format("MMMM Do YYYY, h:mm:ss a");
    const comments = req.body.comments;
    const address = req.body.address;
    const referral = req.body.referral;
    const school = req.body.school;
    const aim = req.body.aim;

    res.locals.flashUrl = req.originalUrl;

    if (!name) {
      return errorHandler.errorResponse("INVALID_FIELD", "visitor name", next);
    }

    if (!classs) {
      return errorHandler.errorResponse("INVALID_FIELD", "class", next);
    }

    if (!address) {
      return errorHandler.errorResponse("INVALID_FIELD", "address", next);
    }

    if (!referral) {
      return errorHandler.errorResponse("INVALID_FIELD", "referral", next);
    }

    if (!school) {
      return errorHandler.errorResponse("INVALID_FIELD", "school", next);
    }

    if (!aim) return errorHandler.errorResponse("INVALID_FIELD", "aim", next);

    if (
      !phone ||
      validator.isEmpty(phone) ||
      !validator.isLength(phone, {
        min: 10,
        max: 10
      })
    ) {
      return errorHandler.errorResponse("INVALID_FIELD", "phone", next);
    }

    if (!emailId || !validator.isEmail(emailId)) {
      return errorHandler.errorResponse("INVALID_FIELD", "email", next);
    }

    const newVisitor = {
      name,
      phone,
      emailId,
      classs,
      date,
      comments,
      address,
      referral,
      school,
      aim
    };

    var promise = vmsController.addNewVisitor(newVisitor);
    promise.then(
      function (createdVisitor) {
        req.flash("success", "Your response has been saved successfully");
        res.redirect("/vms");
      },

      function (err) {
        next(err || "Internal Server Error");
      }
    );
  }
);

router.delete("/:visitorId", (req, res, next) => {
  Visitor.findByIdAndRemove(req.params.visitorId, err => {
    if (!err) {
      req.flash("success", "Entry deleted successfully");
      res.redirect("/admin/db/visitors");
    } else {
      console.log(err);
      next(new errors.generic());
    }
  });
});

router.get("/aboutus", (req, res, next) => {
  res.render("aboutus");
});

router.get("/centers", (req, res, next) => {
  res.render("centers");
});

router.post("/centers", (req, res, next) => {
  req.flash(
    "success",
    "Response recoreded successfully, We will get back to you soon!"
  );
  res.redirect("/centers");
});
router.post("/mdis", (req, res, next) => {
  res.send(200);
})
router.get("/courses", (req, res, next) => {
  res.render("courses");
});

router.get("/courses-list", async (req, res, next) => {
  if (!req.query.title) {
    try {
      const foundCourses = await courseController.findAllCourses();
      res.render("courses-list", {
        foundCourses
      });
    } catch (err) {
      next(err || "Internal Server Error");
    }
  } else {
    try {
      const foundCourse = await courseController.findOneCourseUsingName(
        req.query.title
      );
      res.render("courses-desc", {
        foundCourse
      });
    } catch (err) {
      next(err || "Internal Server Error");
    }
  }
});

router.get("/gallery/category", function (req, res, next) {
  let category = req.query.category;
  let limit = req.query.limit;
  Gallery.find({
    category: {
      $in: category
    }
  })
    .sort({
      uploadDate: -1
    })
    .limit(parseInt(limit))
    .exec(function (err, gallery) {
      if (err) {
        console.log(err);
      } else {
        res.json({
          gallery: gallery
        });
      }
    });
});

router.get("/gallery", (req, res, next) => {
  Gallery.find({}, (err, foundImages) => {
    if (!err && foundImages) {
      res.render("gallery", {
        items: foundImages
      });
    }
  });
});

router.get("/results", (req, res, next) => {
  Gallery.find(
    {
      category: "results"
    },
    (err, foundStudents) => {
      if (!err && foundStudents) {
        res.render("results", {
          students: foundStudents,
          testimonials: foundStudents
        });
      } else {
        console.log(err);
        next(new errors.generic());
      }
    }
  );
});

router.get("/team", (req, res, next) => {
  res.render("team");
});

router.get("/downloads", async (req, res, next) => {
  const foundLinks = await linkController.getAllLinks();
  res.render("downloads", {
    downloads: foundLinks
  });
});

router.get("/tnc", (req, res, next) => {
  res.render("tnc");
});

router.get("/privacy", (req, res, next) => {
  res.render("privacy");
});

router.get("/careers", (req, res, next) => {
  res.render("careers");
});

router.post("/careers", (req, res, next) => {
  req.flash(
    "success",
    "Response recoreded successfully, We will get back to you soon!"
  );
  res.redirect("/careers");
});

router.get("/blog/category/:categoryName", (req, res, next) => {
  const categoryName = req.params.categoryName;
  Blog.find({ category: categoryName }).then();
  const perPage = 10;
  // page is for which page to show (selected)
  let page = req.query.page || 0;
  page = page <= 1 ? 1 : page;

  Blog.count({ publish: "on", category: categoryName })
    .then(count => {
      // count is for how many pages to show
      count = Math.ceil(count / perPage);
      Blog.find({ publish: "on", category: categoryName })
        .limit(perPage)
        .skip(perPage * (page - 1))
        .sort({ uploadDateUnix: -1 })
        .populate({ path: "author", modal: "User" })
        .exec()
        .then(foundBlogs =>
          res.render("blogTheme", {
            foundBlogs,
            count,
            page
          })
        )
        .catch(err => next(err || new Error("Internal Server Error")));
    })
    .catch(err => {
      next(err || new Error("Internal Server Error"));
    });
});

router.get("/blog/page", (req, res, next) => {
  const perPage = 3;
  let page = req.query.page || 0;
  // console.log(page);
  page = page <= 1 ? 1 : page;
  Blog.count({ publish: "on" })
    .then(count => {
      count = Math.ceil(count / perPage);
      Blog.find({
        publish: "on"
      })
        .limit(perPage)
        .skip(perPage * (page - 1))
        .sort({
          uploadDateUnix: -1
        })
        .populate({
          path: "author",
          modal: "User"
        })
        .exec()
        .then(foundBlogs => res.send(foundBlogs))
        .catch(err => next(err || new Error("Internal Server Error")));
    })
    .catch(err => {
      next(err || new Error("Internal Server Error"));
    });
});
router.get("/blog/:url", (req, res, next) => {
  const url = req.params.url;
  res.locals.flashUrl = "/blog/" + url;
  Blog.findOneAndUpdate(
    {
      url
    },
    { $inc: { views: 1 } },
    { upsert: true }
  )
    .populate({
      path: "author",
      modal: "User"
    })
    .exec((err, foundBlog) => {
      if (!foundBlog) {
        return errorHandler.errorResponse(
          "NOT_FOUND",
          "blog",
          next,
          true,
          false
        );
      }

      if (!foundBlog.htmlFilePath) {
        return errorHandler.errorResponse(
          "NOT_FOUND",
          "blog html",
          next,
          true,
          false
        );
      }

      // console.log('blog', foundBlog);
      if (err) {
        return next(err || "Internal Server Error");
      } else {
        Blog.find()
          .sort({
            uploadDateUnix: -1
          })
          .limit(3)
          .exec((err, foundBlogs) => {
            if (err) return next(err || "Internal Server Error");
            else if (foundBlog) {
              if (foundBlog.htmlFilePath) {
                fs.readFile(
                  __dirname +
                  "/../../../HarvinDb/blog/" +
                  foundBlog.htmlFilePath,
                  function (err, data) {
                    if (err) return next(err || "Internal Server Error");
                    res.render("standard_blog_detail", {
                      blogContent: data,
                      foundBlog,
                      foundBlogs
                    });
                  }
                );
              } else {
                return errorHandler.errorResponse(
                  "NOT_FOUND",
                  "blog html",
                  next,
                  true,
                  false
                );
              }
            } else {
              return errorHandler.errorResponse(
                "NOT_FOUND",
                "blog",
                next,
                true,
                false
              );
            }
          });
      }
    });
});

router.get("/blog", (req, res, next) => {
  const perPage = 3;
  let page = req.query.page || 0;
  page = page <= 1 ? 1 : page;

  Blog.count({ publish: "on" })
    .then(count => {
      count = Math.ceil(count / perPage);
      Blog.find({
        publish: "on"
      })
        .limit(perPage)
        .skip(perPage * (page - 1))
        .sort({
          uploadDateUnix: -1
        })
        .populate({
          path: "author",
          modal: "User"
        })
        .exec()
        .then(foundBlogs => {
          Blog.find({ publish: "on" })
            .sort({ views: -1 })
            .limit(perPage)
            .then(foundPopularBlogs => {
              res.render("allBlogs", {
                foundBlogs,
                foundPopularBlogs,
                count,
                page
              });
            });
        })
        .catch(err => next(err || new Error("Internal Server Error")));
    })
    .catch(err => {
      next(err || new Error("Internal Server Error"));
    });
});
router.get("/forum", async (req, res, next) => {
  if (!req.query.title) {
    try {
      const foundPosts = await forumController.findPost();
      // console.log(foundPosts)
      res.render("forum", {
        foundPosts
      });
    } catch (e) {
      next(e);
    }
  }

  try {
    const foundPost = await forumController.findPost({
      postName: req.query.title
    });
    res.render("forumPost", {
      foundPost: foundPost[0]
    });
  } catch (e) { }
});

router.get("/videos/:videoId", async (req, res, next) => {
  const videoId = req.params.videoId || "";
  if (!videoId || !validator.isMongoId(videoId)) {
    return res.render("notFound");
  }

  try {
    const foundVideo = await videoController.findVideoById(videoId);
    res.render("video", {
      video: foundVideo
    });
  } catch (err) {
    next(err);
  }
});

router.get("/videos", async (req, res, next) => {
  try {
    const foundVideos = await videoController.findAllVideos();
    res.render("videos", {
      videos: foundVideos
    });
  } catch (err) {
    next(err);
  }
});
module.exports = router;
