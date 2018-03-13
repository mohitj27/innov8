const express = require('express')
const router = express.Router()
const adminRoutes = require('./admin')
const studentRoutes = require('./student')
const batchRoutes = require('./batch')
const fileRoutes = require('./file')
const dbRoutes = require('./db')
const examRoutes = require('./exam')
const assignmentRoutes = require('./assignment')
const qbRoutes = require('./questionBank')
const resultsRoutes = require('./results')
const vmsRoutes = require('./vms')
const centersRoutes = require('./center')
const blogRoutes = require('./blog')
const coursesRoutes = require('./courses')
const classRoutes = require('./class')
const subjectRoutes = require('./subject')
const chapterRoutes = require('./chapter')
const topicRoutes = require('./topic')
const admissionRoutes = require('./admission')
const studentAppRoutes = require('./studentApp')

router.use('/student', studentRoutes)
router.use('/admin/batches', batchRoutes)
router.use('/admin/files', fileRoutes)
router.use('/admin/db', dbRoutes)
router.use('/admin/exams', examRoutes)
router.use('/admin/assignment', assignmentRoutes)
router.use('/admin/questionBank', qbRoutes)
router.use('/admin/results', resultsRoutes)
router.use('/admin/blog', blogRoutes)
router.use('/admin/centers', centersRoutes)
router.use('/admin/classes', classRoutes)
router.use('/admin/subjects', subjectRoutes)
router.use('/admin/chapters', chapterRoutes)
router.use('/admin/topics', topicRoutes)
router.use('/admin/courses', coursesRoutes)
router.use('/admin/admission', admissionRoutes)
router.use('/admin', adminRoutes)
router.use('/studentApp/home', studentAppRoutes)
router.use(vmsRoutes)

// if not route mentioned in url
router.get('*', function (req, res) {
  res.redirect('/')
})

module.exports = router
