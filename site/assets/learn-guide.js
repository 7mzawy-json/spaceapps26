/* AI-assisted by OpenAI Codex. Chapter navigation for the team's existing lessons and videos. */
(function () {
  'use strict';
  document.body.dataset.learn='';
  var lessons=Array.from(document.querySelectorAll('.lesson'));
  var nav=document.createElement('nav');nav.className='lesson-nav';nav.setAttribute('aria-label','Lesson navigation');
  nav.innerHTML='<label for="lessonSelect">YOUR NEXT QUESTION</label><select id="lessonSelect" aria-label="Choose a lesson"></select><button class="btn ghost sm" id="lessonPrev" type="button" aria-label="Previous lesson">\u2190</button><button class="btn ghost sm" id="lessonNext" type="button" aria-label="Next lesson">\u2192</button>';
  document.querySelector('.hero').appendChild(nav);
  var select=document.getElementById('lessonSelect'),active=0;
  lessons.forEach(function (lesson,i) { var o=document.createElement('option');o.value=i;o.textContent=lesson.querySelector('h3').textContent;select.appendChild(o); });
  function show(id,scroll) {
    if(id==='track-science')id='l1';if(id==='track-site')id='g1';
    var index=lessons.findIndex(function (x) { return x.id===id; });if(index<0)index=0;active=index;
    lessons.forEach(function (lesson,i) { lesson.hidden=i!==index;if(i!==index)lesson.querySelectorAll('video').forEach(function(v){v.pause();}); });
    select.value=index;document.getElementById('lessonPrev').disabled=index===0;document.getElementById('lessonNext').disabled=index===lessons.length-1;
    document.querySelectorAll('.toc a').forEach(function(a){var on=a.hash==='#'+lessons[index].id;a.classList.toggle('on',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    if(scroll) { lessons[index].scrollIntoView({block:'start',behavior:'auto'}); lessons[index].setAttribute('tabindex','-1');lessons[index].focus({preventScroll:true}); }
  }
  function go(i){history.pushState({},'', '#'+lessons[i].id);show(lessons[i].id,true);}
  select.addEventListener('change',function(){go(+select.value);});
  document.getElementById('lessonPrev').addEventListener('click',function(){go(Math.max(0,active-1));});
  document.getElementById('lessonNext').addEventListener('click',function(){go(Math.min(lessons.length-1,active+1));});
  document.querySelectorAll('a[href^="#"]:not(.skip)').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();history.pushState({},'',a.hash);show(a.hash.slice(1),true);});});
  window.addEventListener('popstate',function(){show(location.hash.slice(1),true);});
  show(location.hash.slice(1),false);
})();
