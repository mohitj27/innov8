
$(function(){
  $('.chip').click(function(){
    $('.chip').removeClass('z-depth-4 active-chip')
    $(this).addClass('z-depth-4 active-chip')

    switch ($(this).html()) {
      case 'Janakpuri':
$('.map').attr('src',locations[0])
$('.overview').html(overview[0])
        break;
      case 'Preet Vihar':
$('.map').attr('src',locations[1])
$('.overview').html(overview[1])
        break;

      case 'Meerut':
$('.map').attr('src',locations[2])
$('.overview').html(overview[2])
        break;

      default:
    }


  })
})
let locations=[
`https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1866.513029811001!2d77.072
9616649987!3d28.62788130498618!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x16b6ad9
a405afd25!2sHarvin+Academy!5e0!3m2!1sen!2sin!4v1499683098899`,

`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d56025.53693796154!2d77.25
678771665312!3d28.641866248905934!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m
2!1s0x390cfb56d7a68be1%3A0xc0d24e384452c9f7!2sHarvin+Academy!5e0!3m2!1sen!2sin!4
v1493884209281`,

`https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d3490.0766360404123!2d77.70
96114!3d28.9851!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390c64e3588e762d%3A0xcc63361
beea3ad6f!2sSaraswati+Plaza!5e0!3m2!1sen!2sin!4v1493885153091`
]
let overview=[
  `Our newest centre is situated in West Delhi district of NCT i.e. Janak Puri, which is one of the
famous place for coaching centres in Delhi. We are placed amidst the busiest as well as the
place full of coaching centres for preparation of Medical entrance exams, IIT and many more.
Our centre is easily accessible by road and Delhi metro.
Harvin Academy is fully furnished and provides with a student-friendly environment. We, at
Harvin seek to provide the best quality education by getting placed in area which has a plethora
of coaching centres. We are passionate to create the most vigorous education system, that
proves to be the best among all the other education centres.`,
`Our centre location in East Delhi, Preet Vihar, is a place easily accessible by Delhi Metro. Most
of the students who reside in East Delhi run towards other parts of the Delhi, in search of a good
coaching centre. Therefore, we are situated in such a location which provides students an
opportunity to study and learn in such an area where there are so less of good coaching centres
for competitive exam preparation.
Harvin Academy is zealous to provide quality education to the students and is focussed on the
needs of the students. We seek to empower your academic abilities.`,
`Harvin Academy is situated in Meerut, a district in Uttar Pradesh, which is a hub of coaching
institutes for competitive exams. Besides being placed in a city, which has a plethora of
coaching centres, we offer the aspirants an offer to improve their logical and analytical skills.We
are passionate towards providing our students with the best quality education.
At Harvin, we aim to deliver highest level of conceptual clarity to the students by integration of
social education to create a revolution in the coaching industry. Harvin is the best guide to the
best minds.`

]