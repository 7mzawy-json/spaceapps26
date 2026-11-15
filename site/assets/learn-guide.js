/* AI-assisted by OpenAI Codex, simplified with Claude Code. Shows one lesson at a time; the contents list on the left
   is the only way to move between lessons (on phones it becomes a strip under the top bar). */
(function () {
  'use strict';
  document.body.dataset.learn='';
  var lessons=Array.from(document.querySelectorAll('.lesson')),toc=document.querySelector('.toc');
  function show(id,scroll) {
    if(id==='track-science')id='l1';if(id==='track-site')id='g1';
    var index=lessons.findIndex(function (x) { return x.id===id; });if(index<0)index=0;
    lessons.forEach(function (lesson,i) { lesson.hidden=i!==index;if(i!==index)lesson.querySelectorAll('video').forEach(function(v){v.pause();}); });
    document.querySelectorAll('.toc a').forEach(function(a){var on=a.hash==='#'+lessons[index].id;a.classList.toggle('on',on);if(on){a.setAttribute('aria-current','page');if(toc&&toc.scrollWidth>toc.clientWidth)toc.scrollLeft=a.offsetLeft-(toc.clientWidth-a.offsetWidth)/2;}else a.removeAttribute('aria-current');});
    if(scroll) { lessons[index].scrollIntoView({block:'start',behavior:'auto'}); lessons[index].setAttribute('tabindex','-1');lessons[index].focus({preventScroll:true}); }
  }
  document.querySelectorAll('a[href^="#"]:not(.skip)').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();history.pushState({},'',a.hash);show(a.hash.slice(1),true);});});
  window.addEventListener('popstate',function(){show(location.hash.slice(1),true);});
  show(location.hash.slice(1),false);
})();
