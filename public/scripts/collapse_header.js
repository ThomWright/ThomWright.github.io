$(document).ready(function () {
  var outer = $('#affix-outer'),
      collapse = $('#affix-collapse'),
      sticky = $('#affix-sticky'),
      wrapper = $('#affix-wrapper'),
      setWrapperHeight = function() {
        wrapper.css('min-height', sticky.height());
      },
      getOffset = function() {
        return collapse.outerHeight(true/*include margin*/);
      };

  setWrapperHeight();

  outer.affix({
    offset: {
      top: getOffset()
    }
  });

  $(window).on("resize", function(){
    setWrapperHeight();
    outer.data('bs.affix').options.offset = getOffset();
  });
});

