const express = require('express')
const topicController = require('../controllers/topic.controller')
const router = express.Router()
const middleware = require('../middleware')

router.get('/:topicName', middleware.isLoggedIn, async function (req, res, next) {
  const topicName = req.params.topicName

  try {
    const foundTopic = await topicController.findTopicByTopicNameAndUserId(topicName, req.user)
    return res.json({
      topic: foundTopic
    })
  } catch (err) {
    next(err || 'Internal Server Error')
  }
})

module.exports = router
