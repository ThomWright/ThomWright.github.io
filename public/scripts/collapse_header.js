$(document).ready(function () {
  var outer = $('#affix-outer'),
      sticky = $('.affix-sticky');

  outer.affix({
    offset: {
      top: sticky.offset().top
    }
  });

  $(window).on("resize", function(){
    outer.data('bs.affix').options.offset = sticky.offset().top;
  });
});

