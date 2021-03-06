window.blogInsert = true

$(function () {
  $('.newBlogForm').submit(function (e) {
    e.preventDefault()
    var data = CKEDITOR.instances.editor1.getData()
    $('#editordata').val(data)
    const formData = new FormData(e.target)

    axios.post('/admin/blog', formData)
      .then(res => {
        if (res.status === 200) {
          window.location.replace('/admin/blog/all')
        }
      })
      .catch(err => {
        console.log('err', JSON.stringify(err))
        Materialize.toast($('<span>' + err.response.data + '</span>'), 4000)
        $('.toast').css('background-color', '#f44336')
      })
  })

  $('.modal').modal({
    dismissible: true
  })
  $('ul.tabs').tabs()
  $('.button-collapse-image').sideNav({
    menuWidth: 300, // Default is 300
    edge: 'left', // Choose the horizontal origin
    closeOnClick: true, // Closes side-nav on <a> clicks, useful for Angular/Meteor\
    draggable: true, // Choose whether you can drag to open on touch screens,
    onOpen: function (el) { /* Do Stuff */ }, // A function to be called when sideNav is opened
    onClose: function (el) { /* Do Stuff */ } // A function to be called when sideNav is closed
  })

  var socket = io('https://harvin.academy/')
  socket.emit('message', 'Hello server')

  socket.on('connect', function () {
    socket.emit('message', 'Hello server12')
    socket.on('end upload', (data) => {
      $('.progress').fadeOut(2000, function () {
        $('.progress').remove()
      })
      let currImageElement = $('<img>')
      currImageElement.attr('src', currImageElementSrc)

      $('#editor1').append(currImageElement)
      //     if ($('#summernote').length !== 0) {
      //   $('#summernote').summernote({
      //     placeholder: 'Write your content here!!!',
      //     tabsize: 2,
      //     minHeight: 500,
      //     maxHeight: null,
      //     focus: true
      //   });
      // }
    })

    socket.on('upload error', () => {
      console.log('aborting')
      fileReader.abort()
    })
  })
  let span = document.createElement('span')

  function checkBlogTitle (event) {
    let blogTitle = $('#blog_title').val()
    // console.log('title1', blogTitle)
    if (blogTitle == '') {
      event.preventDefault()
      event.stopPropagation()

      alert('please specify the blog title')
      return false
    } else {
      return true
    }
  }

  function handleFileSelect (evt) {
    var files = evt.target.files // FileList object
    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {
      // Only process image files.
      if (!f.type.match('image.*')) {
        continue
      }
      var reader = new FileReader()
      // Closure to capture the file information.
      reader.onload = (function (theFile) {
        return function (e) {
          var span = document.createElement('span')

          span.innerHTML = ['<img class="thumb" src="', e.target.result,
            '" title="', escape(theFile.name), '"/><div>https://harvin.academy/blogImage/' + theFile.name + '</div><div class="progress"><div class="indeterminate"></div></div>'
          ].join('')
          document.getElementById('img-to-upload').insertBefore(span, null)
        }
      })(f)
      // Read in the image file as a data URL.
      reader.readAsDataURL(f)
    }
    var fileReader = new FileReader()
    // console.log('state of reader', fileReader.readyState)
    let blogTitle = $('#blog_title').val()

    // console.log('evt', evt)
    var file = evt.target.files[0] // FileList object
    $.post('/admin/blog/' + blogTitle + '/images', {
      'filename': file.name
    })
    if (!file.type.match('image.*')) {
      return
    }
    // console.log(file)
    fileReader.readAsArrayBuffer(file)
    fileReader.onload = (evt) => {
      currImageElementSrc = '/blogImage/' + file.name

      var arrayBuffer = fileReader.result
      socket.emit('hello', 'hello')
      socket.emit('slice upload', {
        name: file.name,
        type: file.type,
        size: file.size,
        data: arrayBuffer
      })
    }

    fileReader.onloadend = () => {
      fileReader = null
      socket.emit('end upload', 'end')
    }
  }

  document.getElementById('files').addEventListener('change', handleFileSelect, false)
  document.getElementById('files').addEventListener('click', checkBlogTitle, false)
})
