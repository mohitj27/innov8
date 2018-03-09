const express = require('express')
const path = require('path')
const moment = require('moment-timezone')
const middleware = require('../middleware')
const errorHandler = require('../errorHandler')
const validator = require('validator')
const fileController = require('../controllers/file.controller')
const topicController = require('../controllers/topic.controller')
const chapterController = require('../controllers/chapter.controller')
const subjectController = require('../controllers/subject.controller')
const classController = require('../controllers/class.controller')
const router = express.Router()

const FILE_DIR = path.normalize(__dirname + '/../../../HarvinDb/FileUploads/')

// Form for uploading a file
router.get('/new', middleware.isLoggedIn, middleware.isCentreOrAdmin, (req, res, next) => {
  res.render('uploadFile')
})

// Handle file upload
router.post('/new', middleware.isLoggedIn, middleware.isCentreOrAdmin, async function (req, res, next) {
  res.locals.flashUrl = req.originalUrl

  const uploadDate = moment(Date.now()).tz('Asia/Kolkata').format('MMMM Do YYYY, h:mm:ss a')
  const subjectName = req.body.subjectName || ''
  const chapterName = req.body.chapterName || ''
  const chapterDescription = req.body.chapterDescription
  const topicName = req.body.topicName || ''
  const topicDescription = req.body.topicDescription
  const className = req.body.className || ''

  if (!className || validator.isEmpty(className)) return errorHandler.errorResponse('INVALID_FIELD', 'class name', next)
  if (!subjectName || validator.isEmpty(subjectName)) return errorHandler.errorResponse('INVALID_FIELD', 'subject name', next)
  if (!chapterName || validator.isEmpty(chapterName)) return errorHandler.errorResponse('INVALID_FIELD', 'chapter name', next)
  if (!topicName || validator.isEmpty(topicName)) return errorHandler.errorResponse('INVALID_FIELD', 'topic name', next)

  const user = req.user

  const newTopic = {
    topicName,
    topicDescription
  }

  const newChapter = {
    chapterName,
    chapterDescription
  }

  const newSubject = {
    subjectName
  }

  const newClass = {
    className
  }

  try {
    if (req.files) {
      const userFile = req.files.userFile
      const fileName = userFile.name
      const fileType = path.extname(userFile.name)
      const filePath = path.join(FILE_DIR, Date.now() + '__' + userFile.name)
      const fileSize = userFile.data.byteLength

      var newFile = {
        fileName,
        fileType,
        filePath,
        uploadDate,
        fileSize
      }
      await fileController.uploadFileToDirectory(filePath, userFile)
    }

    var createdFile
    if (newFile) {
      createdFile = await fileController.createNewFile(newFile)
    }

    var updatedTopic
    if (createdFile) {
      updatedTopic = await topicController.addFileToTopicByTopicNameAndUserId(newTopic, user, createdFile)
    } else {
      updatedTopic = await topicController.createOrUpdateTopicByTopicNameAndUserId(newTopic, user)
    }

    var updatedChapter = await chapterController.addTopicToChapterByChapterNameAndUserId(newChapter, user, updatedTopic)
    var updatedSubject = await subjectController.addChapterToSubjectBySubjectClassAndUserId(newSubject, className, user, updatedChapter)
    var updatedClass = await classController.addSubjectToClassByClassNameAndUserId(newClass, user, updatedSubject)
    updatedSubject = await subjectController.addClassToSubjectById(updatedSubject, updatedClass)
    updatedChapter = await chapterController.addSubjectToChapterById(updatedChapter, updatedSubject)
    updatedTopic = await topicController.addChapterToTopicById(updatedTopic, updatedChapter)

    if (createdFile) {
      await fileController.addTopicChapterSubjectClassToFileById(createdFile, updatedTopic, updatedChapter, updatedSubject, updatedClass)
    }

    req.flash('success', 'Successfully created new entries')
    res.redirect('/admin/files/new')
  } catch (err) {
    next(err || 'Internal Server Error')
  }
})

router.get('/:fileId', async function (req, res, next) {
  const fileId = req.params.fileId || ''

  if (!fileId || !validator.isMongoId(fileId)) return errorHandler.errorResponse('INVALID_FIELD', 'File id', next)

  try {
    const foundFile = await fileController.findFileById(fileId)
    res.download(foundFile.filePath, foundFile.fileName, (err) => {
      if (err) return next(err || 'Internal Server Error')
    })
  } catch (err) {
    next(err || 'Internal Server Error')
  }
})

module.exports = router
