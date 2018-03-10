const express = require('express')
const router = express.Router()
const validator = require('validator')
const errorHandler = require('../errorHandler')
const coursesCont = require('../controllers/courses.controller')
const fileController = require('../controllers/file.controller')
const path = require('path')
const COURSEIMAGE_SAVE_LOCATION = path.normalize(__dirname + '/../../../HarvinDb/courseImages/')

router.get('/new', (req, res) => {
  res.render('newCourse')
})

router.get('/all', async (req, res, next) => {
  try {
    const foundCourses = await coursesCont.findAllCourses()
    res.render('coursesList', {
      foundCourses
    })
  } catch (err) {
    next(err || 'Internal Server Error')
  }
})

router.get('/:courseId/edit', async (req, res, next) => {
  res.locals.flashUrl = req.header.referer

  const courseId = req.params.courseId || ''
  if (!courseId || !validator.isMongoId(courseId)) return errorHandler.errorResponse('INVALID_FIELD', 'course id', next)

  try {
    const foundCourse = await coursesCont.findCourseById(courseId)
    res.render('editCourse', {
      foundCourse
    })
  } catch (err) {
    next(err || 'Internal Server Error')
  }
})

router.post('/', async (req, res, next) => {
  if (!req.files) return errorHandler.errorResponse('INVALID_FIELD', 'file', next)
  let courseImage = req.files.courseImage
  const filePath = path.join(COURSEIMAGE_SAVE_LOCATION, courseImage.name)
  try {
    await fileController.uploadFileToDirectory(filePath, courseImage)
  } catch (err) {
    return next(err || 'Internal Server Error')
  }
  console.log(req.files)
  const courseName = req.body.courseName,
    courseTimings = req.body.courseTimings,
    courseStartingFrom = req.body.courseStartingFrom,
    courseDescription = req.body.courseDescription,
    courseFor = req.body.courseFor,
    courseAdmissionThrough = req.body.courseAdmissionThrough,
    courseFrequency = req.body.courseFrequency
  const course = {
    courseName,
    courseTimings,
    courseStartingFrom,
    courseDescription,
    courseFor,
    courseAdmissionThrough,
    courseFrequency
  }

  if (req.files) {
    courseImage = courseImage.name,
    course.courseImage = courseImage
  }
  coursesCont.insertInCourse(course).then((result) => {
    if (result) {
      req.flash('success', 'Course Inserted Successfully')
      res.redirect('/admin/courses/all')
    }
  }).catch(err => next(err || 'Internal Server Error'))
})
router.delete('/delete/:courseName', (req, res, next) => {
  try {
    const courseName = coursesCont.deleteOneCourse(req.params.courseName)
    res.sendStatus(200)
  } catch (err) {
    next(err || 'Internal Server Error')
  }
})
module.exports = router
