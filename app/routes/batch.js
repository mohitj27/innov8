const express = require('express')
const batchController = require('../controllers/batch.controller')
const subjectController = require('../controllers/subject.controller')
const errorHandler = require('../errorHandler')
const middleware = require('../middleware')
const router = express.Router()
const validator = require('validator')

router.get('/updateBatch', middleware.isLoggedIn, middleware.isCentreOrAdmin, async function (req, res, next) {
  try {
    const foundSubjects = await subjectController.findSubjectByUserId(req.user)
    res.render('createBatch', {
      subjects: foundSubjects
    })
  } catch (err) {
    next(err || 'Internal Server Error')
  }
})

router.post('/updateBatch', middleware.isLoggedIn, middleware.isCentreOrAdmin, async function (req, res, next) {
  res.locals.flashUrl = req.originalUrl

  var subjectId = req.body.subjectId
  var batchName = req.body.batchName || ''
  var batchDesc = req.body.batchDesc

  if (!batchName || validator.isEmpty(batchName)) return errorHandler.errorResponse('INVALID_FIELD', 'batch name', next)

  const newBatch = {
    batchName,
    batchDesc
  }

  try {
    const foundSubjects = await subjectController.findSubjectsByIds(subjectId)
    await batchController.createOrUpdateSubjectsToBatchByBatchNameAndUserId(newBatch, req.user, foundSubjects)
    req.flash('success', 'Batch updated successfully')
    res.redirect(req.originalUrl)
  } catch (err) {
    next(err || 'Internal Server Error')
  }
})

// finding batch with given batchName and populating the subject field in it
router.get('/:batchName', async function (req, res, next) {
  try {
    const foundBatch = await batchController.findBatchByBatchName(req.params.batchName)
    foundBatch.populate('subjects', (err, foundBatch) => {
      if (err) return next(err || 'Internal Server Error')
      else {
        return res.json({
          batch: foundBatch
        })
      }
    })
  } catch (err) {
    next(err || 'Internal Server Error')
  }
})

// Providing list of batches
router.get('/', async (req, res, next) => {
  let foundBatches

  if (req.user) {
    try {
      foundBatches = await batchController.findBatchByUserId(req.user)
    } catch (err) {
      next(err || 'Internal Server Error')
    }
  } else {
    try {
      foundBatches = await batchController.findAllBatch()
    } catch (err) {
      next(err || 'Internal Server Error')
    }
  }

  res.json({
    batches: foundBatches
  })
})

module.exports = router
