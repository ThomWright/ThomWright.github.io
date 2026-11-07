// Marks the section being read in a page's contents, and names it in the
// narrow-screen bar. The contents work without this; it only helps readers
// keep their place.
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('.contents a'));
  var bar = document.querySelector('.contents-bar details');
  var barLabel = document.querySelector('.contents-current');
  if (!links.length || !bar || !barLabel) return;

  var linkTargets = links.map(function (link) {
    return document.getElementById(decodeURIComponent(link.hash.slice(1)));
  });
  // Both versions of the contents link to the same headings.
  var headings = linkTargets.filter(function (heading, i) {
    return heading && linkTargets.indexOf(heading) === i;
  });

  // A heading counts as reached once it's this close to the top of the
  // screen: below the sticky bar, and where a jump to it lands.
  var reachedPx = 120;

  function currentHeading() {
    var current = null;
    var atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
    headings.forEach(function (heading) {
      var top = heading.getBoundingClientRect().top;
      // At the bottom of the page, the last sections can't scroll up to the
      // top, so any heading on screen counts.
      if (top < reachedPx || (atBottom && top < innerHeight)) current = heading;
    });
    return current;
  }

  // A long list scrolls on its own, so the current section can be out of
  // view in it. This scrolls only the list, never the page.
  function scrollIntoList(link, list) {
    if (!link || !list) return;
    var listBox = list.getBoundingClientRect();
    var linkBox = link.getBoundingClientRect();
    if (linkBox.top < listBox.top) list.scrollTop -= listBox.top - linkBox.top;
    else if (linkBox.bottom > listBox.bottom) list.scrollTop += linkBox.bottom - listBox.bottom;
  }

  var marginList = document.querySelector('.contents-margin');
  var barList = bar.querySelector('ul');

  function currentLink(container) {
    return container && container.querySelector('a.current');
  }

  function update() {
    var current = currentHeading();
    var label = '';
    links.forEach(function (link, i) {
      var isCurrent = current !== null && linkTargets[i] === current;
      link.classList.toggle('current', isCurrent);
      if (isCurrent) label = link.textContent;
    });
    barLabel.textContent = label;
    scrollIntoList(currentLink(marginList), marginList);
  }

  var scheduled = false;
  function scheduleUpdate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      update();
    });
  }
  addEventListener('scroll', scheduleUpdate, { passive: true });
  addEventListener('resize', scheduleUpdate);

  // The bar's open list covers the text, so it closes once a section is chosen.
  bar.addEventListener('click', function (e) {
    if (e.target.closest('a')) bar.open = false;
  });
  bar.addEventListener('toggle', function () {
    if (bar.open) scrollIntoList(currentLink(barList), barList);
  });

  update();
})();
