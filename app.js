(() => {
  const D = window.PORTAL_DATA;
  const DAYS = D.days;
  const daySelect = document.getElementById("daySelect");
  const timeInput = document.getElementById("timeInput");
  const sectionFilter = document.getElementById("sectionFilter");
  const teacherSearch = document.getElementById("teacherSearch");
  const teacherGrid = document.getElementById("teacherGrid");
  const summary = document.getElementById("summary");
  const dataWarning = document.getElementById("dataWarning");
  const teacherSelect = document.getElementById("teacherSelect");
  const teacherProfile = document.getElementById("teacherProfile");
  const weekGrid = document.getElementById("weekGrid");
  const nowButton = document.getElementById("nowButton");

  const dayMap = {1:"Lunes",2:"Martes",3:"Miércoles",4:"Jueves",5:"Viernes"};

  const esc = (v) => String(v ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");

  function mins(t){ const [h,m] = t.split(":").map(Number); return h*60+m; }
  function atTime(start,end,t){ const x=mins(t); return x>=mins(start) && x<mins(end); }
  function fmt(t){
    const [h,m]=t.split(":").map(Number);
    const ap=h>=12?"p. m.":"a. m.";
    const hh=h%12||12;
    return `${hh}:${String(m).padStart(2,"0")} ${ap}`;
  }
  function range(e){ return `${fmt(e.start)} – ${fmt(e.end)}`; }

  function teacherByName(name){ return D.teachers.find(t=>t.name===name); }

  function worksAt(t,day,time){
    if(!t.labor || !t.labor.days.includes(day)) return false;
    return mins(time)>=mins(t.labor.start) && mins(time)<mins(t.labor.end);
  }

  function exactAt(name,day,time){
    return D.exactEvents.filter(e=>e.teacher===name && e.day===day && atTime(e.start,e.end,time));
  }

  function tentativeAt(name,day,time){
    return D.tentativeEvents.filter(e=>e.teachers.includes(name) && e.day===day && atTime(e.start,e.end,time));
  }

  function statusFor(t,day,time){
    if(!worksAt(t,day,time)) return {kind:"off",label:"Fuera de jornada",events:[]};
    const exact=exactAt(t.name,day,time);
    if(exact.length) return {kind:"busy",label:"En clase",events:exact};
    const maybe=tentativeAt(t.name,day,time);
    if(maybe.length) return {kind:"maybe",label:"Por confirmar",events:maybe};
    return {kind:"free",label:"Disponible",events:[]};
  }

  function eventText(events, tentative=false){
    if(!events.length) return tentative ? "Asignación de docente no determinada." : "Sin clase identificada.";
    return events.map(e =>
      `${e.subject} · ${e.course} · ${e.section}${tentative ? " · posible asignación" : ""}`
    ).join("<br>");
  }

  function teacherMatchesSection(t){
    const f=sectionFilter.value;
    if(f==="Todas") return true;
    return t.sections.includes(f);
  }

  function renderQuick(){
    const day=daySelect.value;
    const time=timeInput.value || "10:10";
    const q=teacherSearch.value.trim().toLocaleLowerCase("es");

    const unresolved = D.unassignedEvents.filter(e=>e.day===day && atTime(e.start,e.end,time));
    if(unresolved.length){
      const labels=[...new Set(unresolved.map(e=>`${e.subject} (${e.course})`))];
      dataWarning.classList.remove("hidden");
      dataWarning.innerHTML =
        `<strong>Atención:</strong> en esta franja hay ${unresolved.length} actividad(es) sin docente identificado en el listado: ` +
        `${labels.slice(0,4).map(esc).join(", ")}${labels.length>4?"…":""}. ` +
        `La disponibilidad debe leerse como “sin clase identificada”.`;
    }else{
      dataWarning.classList.add("hidden");
      dataWarning.textContent="";
    }

    const rows=D.teachers
      .filter(teacherMatchesSection)
      .filter(t=>!q || t.name.toLocaleLowerCase("es").includes(q) || t.subjects.join(" ").toLocaleLowerCase("es").includes(q))
      .map(t=>({t,s:statusFor(t,day,time)}));

    const order={free:0,busy:1,maybe:2,off:3};
    rows.sort((a,b)=>order[a.s.kind]-order[b.s.kind] || a.t.name.localeCompare(b.t.name,"es"));

    const counts={free:0,busy:0,maybe:0,off:0};
    rows.forEach(r=>counts[r.s.kind]++);
    summary.innerHTML = `
      <div class="summary__item"><strong>${counts.free}</strong><span>Disponibles</span></div>
      <div class="summary__item"><strong>${counts.busy}</strong><span>En clase</span></div>
      <div class="summary__item"><strong>${counts.maybe}</strong><span>Por confirmar</span></div>
      <div class="summary__item"><strong>${counts.off}</strong><span>Fuera de jornada</span></div>`;

    teacherGrid.innerHTML = rows.map(({t,s})=>{
      let detail="";
      if(s.kind==="busy") detail=eventText(s.events);
      else if(s.kind==="maybe") detail=eventText(s.events,true);
      else if(s.kind==="free") detail=`Sin clase identificada a las ${fmt(time)}.`;
      else detail=t.labor && t.labor.days.includes(day)
          ? `Jornada: ${fmt(t.labor.start)} – ${fmt(t.labor.end)}`
          : `No trabaja este día según la jornada registrada.`;

      const sections=t.sections.filter(x=>x!=="Bachillerato").join(" · ");
      return `
        <article class="teacher-card teacher-card--${s.kind}" data-name="${esc(t.name)}" tabindex="0">
          <div class="teacher-card__top">
            <h3>${esc(t.name)}</h3>
            <span class="pill pill--${s.kind}">${esc(s.label)}</span>
          </div>
          <p class="teacher-card__detail">${detail}</p>
          <div class="teacher-card__meta">
            ${esc(t.subjects.filter(x=>x!=="Dirección de grupo").join(" · "))}<br>
            ${esc(sections)}
          </div>
        </article>`;
    }).join("") || `<p>No hay profesores que coincidan con el filtro.</p>`;

    document.querySelectorAll(".teacher-card").forEach(card=>{
      const open=()=>{
        teacherSelect.value=card.dataset.name;
        renderTeacher(card.dataset.name);
        document.querySelector(".detail-card").scrollIntoView({behavior:"smooth",block:"start"});
      };
      card.addEventListener("click",open);
      card.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open();}});
    });
  }

  function teacherEvents(name,day){
    const exact=D.exactEvents.filter(e=>e.teacher===name && e.day===day).map(e=>({...e,kind:"busy"}));
    const maybe=D.tentativeEvents.filter(e=>e.teachers.includes(name) && e.day===day).map(e=>({...e,kind:"maybe"}));
    return [...exact,...maybe].sort((a,b)=>mins(a.start)-mins(b.start) || mins(a.end)-mins(b.end));
  }

  function renderTeacher(name){
    const t=teacherByName(name);
    if(!t) return;

    const laborText=t.labor
      ? `${t.labor.days.join(", ")} · ${fmt(t.labor.start)} – ${fmt(t.labor.end)}`
      : "Sin jornada registrada";

    teacherProfile.innerHTML=`
      <div class="profile-box"><span>Profesor</span><strong>${esc(t.name)}</strong></div>
      <div class="profile-box"><span>Asignaturas</span><strong>${esc(t.subjects.filter(x=>x!=="Dirección de grupo").join(" · "))}</strong></div>
      <div class="profile-box"><span>Jornada</span><strong>${esc(laborText)}</strong></div>`;

    weekGrid.innerHTML=DAYS.map(day=>{
      const works=t.labor && t.labor.days.includes(day);
      if(!works){
        return `<article class="day-card"><h3>${esc(day)}</h3><div class="day-list">
          <div class="event event--off"><strong>Fuera de jornada</strong>No trabaja este día.</div>
        </div></article>`;
      }
      const events=teacherEvents(name,day);
      const content=events.length ? events.map(e=>`
        <div class="event event--${e.kind}">
          <strong>${esc(range(e))}</strong>
          ${esc(e.subject)} · ${esc(e.course)}<br>
          <small>${esc(e.section)}${e.kind==="maybe"?" · docente por confirmar":""}</small>
        </div>`).join("")
        : `<div class="event event--free"><strong>Sin clases identificadas</strong>La jornada figura libre en los horarios suministrados.</div>`;
      return `<article class="day-card"><h3>${esc(day)}</h3><div class="day-list">${content}</div></article>`;
    }).join("");
  }

  function setNow(){
    const n=new Date();
    const d=dayMap[n.getDay()];
    if(d) daySelect.value=d;
    timeInput.value=`${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
    renderQuick();
  }

  DAYS.forEach(d=>{
    const o=document.createElement("option");
    o.value=o.textContent=d; daySelect.appendChild(o);
  });

  D.teachers.forEach(t=>{
    const o=document.createElement("option");
    o.value=o.textContent=t.name; teacherSelect.appendChild(o);
  });

  const today=dayMap[new Date().getDay()];
  daySelect.value=today || "Lunes";
  const initial=D.teachers.find(t=>t.name==="Nicolás B")?.name || D.teachers[0].name;
  teacherSelect.value=initial;

  [daySelect,timeInput,sectionFilter].forEach(el=>el.addEventListener("change",renderQuick));
  teacherSearch.addEventListener("input",renderQuick);
  teacherSelect.addEventListener("change",()=>renderTeacher(teacherSelect.value));
  nowButton.addEventListener("click",setNow);


  // ===== Horario del colegio con nombres de profesores =====
  const teacherTimetableDay = document.getElementById("teacherTimetableDay");
  const teacherTimetableSection = document.getElementById("teacherTimetableSection");
  const teacherTimetableHead = document.getElementById("teacherTimetableHead");
  const teacherTimetableBody = document.getElementById("teacherTimetableBody");
  const teacherTimetableInfo = document.getElementById("teacherTimetableInfo");

  DAYS.forEach(d=>{
    const o=document.createElement("option");
    o.value=o.textContent=d;
    teacherTimetableDay.appendChild(o);
  });
  teacherTimetableDay.value="Lunes";

  const sectionCourses = {
    "Primaria":["PRIMERO","SEGUNDO","TERCERO","CUARTO","QUINTO"],
    "Preescolar":["PREJARDÍN A","PREJARDÍN B","JARDÍN A","JARDÍN B","TRANSICIÓN A","TRANSICIÓN B"]
  };

  function keyFor(e){ return `${e.day}|${e.section}|${e.start}|${e.end}|${e.course}|${e.subject}`; }

  function allClassCells(day,section){
    const map=new Map();

    const addBase=(e)=>{
      if(e.day!==day || e.section!==section) return;
      const k=keyFor(e);
      if(!map.has(k)) map.set(k,{
        day:e.day,section:e.section,start:e.start,end:e.end,
        course:e.course,subject:e.subject,teachers:[],unknown:false
      });
      return map.get(k);
    };

    D.exactEvents.forEach(e=>{
      const cell=addBase(e);
      if(cell && !cell.teachers.includes(e.teacher)) cell.teachers.push(e.teacher);
    });

    D.tentativeEvents.forEach(e=>{
      const cell=addBase(e);
      if(cell){
        e.teachers.forEach(n=>{if(!cell.teachers.includes(n)) cell.teachers.push(n);});
        cell.tentative=true;
      }
    });

    D.unassignedEvents.forEach(e=>{
      const cell=addBase(e);
      if(cell) cell.unknown=true;
    });

    return [...map.values()];
  }

  function teacherHasOtherEvent(name, target){
    return D.exactEvents.some(e =>
      e.teacher===name &&
      e.day===target.day &&
      !(mins(e.end)<=mins(target.start) || mins(e.start)>=mins(target.end)) &&
      keyFor(e)!==keyFor(target)
    );
  }

  function renderTeacherTimetable(){
    const day=teacherTimetableDay.value;
    const section=teacherTimetableSection.value;
    const courses=sectionCourses[section];
    const cells=allClassCells(day,section);

    const ranges=[...new Map(cells.map(c=>[`${c.start}-${c.end}`,{start:c.start,end:c.end}])).values()]
      .sort((a,b)=>mins(a.start)-mins(b.start));

    teacherTimetableHead.innerHTML=`
      <tr>
        <th>Hora</th>
        ${courses.map(c=>`<th>${esc(c.replaceAll("Í","í").replaceAll("Ó","ó"))}</th>`).join("")}
      </tr>`;

    teacherTimetableBody.innerHTML=ranges.map(r=>{
      const cols=courses.map(course=>{
        const match=cells.filter(c=>c.course===course && c.start===r.start && c.end===r.end);
        if(!match.length) return `<td>—</td>`;

        const c=match[0];
        const multiple=c.teachers.length>1;
        let names="";
        if(c.teachers.length){
          names=c.teachers.map(n=>{
            const conflict=teacherHasOtherEvent(n,c);
            return `<span class="teacher-name ${multiple?"teacher-name--multi":""}">${esc(n)}</span>${conflict?'<span class="conflict-note">⚠ cruce</span>':""}`;
          }).join(" ");
        }else{
          names=`<span class="unknown-teacher">Docente sin identificar</span>`;
        }

        return `<td>
          ${names}
          <span class="cell-subject">${esc(c.subject)}</span>
        </td>`;
      }).join("");

      return `<tr><td class="time-cell">${esc(fmt(r.start))}<br>${esc(fmt(r.end))}</td>${cols}</tr>`;
    }).join("");

    const englishCells=cells.filter(c=>c.subject==="Inglés" && c.teachers.length===3).length;
    teacherTimetableInfo.innerHTML=
      `<strong>${esc(day)} · ${esc(section)}</strong><br>`+
      `${cells.length} clases identificadas`+
      (englishCells ? ` · ${englishCells} bloque(s) de Inglés con tres profesoras simultáneas` : "");
  }

  teacherTimetableDay.addEventListener("change",renderTeacherTimetable);
  teacherTimetableSection.addEventListener("change",renderTeacherTimetable);


  // ===== Segunda opción: Consultar horas libres de un docente =====
  const modeButtons = document.querySelectorAll(".mode-switch__button");
  const modeAvailability = document.getElementById("mode-availability");
  const modeTeacherFree = document.getElementById("mode-teacher-free");

  function setMode(mode){
    modeButtons.forEach(btn=>btn.classList.toggle("is-active", btn.dataset.mode===mode));
    modeAvailability.classList.toggle("is-active", mode==="availability");
    modeTeacherFree.classList.toggle("is-active", mode==="teacher-free");
    if(mode==="teacher-free") renderFreeTeacherWeek();
  }

  modeButtons.forEach(btn=>{
    btn.addEventListener("click",()=>setMode(btn.dataset.mode));
  });

  const freeTeacherSelect = document.getElementById("freeTeacherSelect");
  const freeTeacherSummary = document.getElementById("freeTeacherSummary");
  const freeTeacherHead = document.getElementById("freeTeacherHead");
  const freeTeacherBody = document.getElementById("freeTeacherBody");
  const freeTeacherMobile = document.getElementById("freeTeacherMobile");

  D.teachers.forEach(t=>{
    const o=document.createElement("option");
    o.value=o.textContent=t.name;
    freeTeacherSelect.appendChild(o);
  });

  function realBlocksForTeacher(t){
    // Solo se usan bloques lectivos reales declarados en data.js.
    // No se construyen límites artificiales ni subdivisiones por minutos.
    const relevantSections = new Set(t.sections || []);
    const merged = new Map();

    D.scheduleBlocks.forEach(block=>{
      if(!relevantSections.has(block.section)) return;

      const key = `${block.day}|${block.start}|${block.end}`;
      if(!merged.has(key)){
        merged.set(key,{
          day:block.day,
          start:block.start,
          end:block.end,
          sections:[],
          labels:[]
        });
      }
      const item=merged.get(key);
      if(!item.sections.includes(block.section)) item.sections.push(block.section);
      if(block.label && !item.labels.includes(block.label)) item.labels.push(block.label);
    });

    return [...merged.values()].sort((a,b)=>{
      const dayDiff=DAYS.indexOf(a.day)-DAYS.indexOf(b.day);
      if(dayDiff) return dayDiff;
      return mins(a.start)-mins(b.start) || mins(a.end)-mins(b.end);
    });
  }

  function eventOverlaps(e,start,end){
    return !(mins(e.end)<=mins(start) || mins(e.start)>=mins(end));
  }

  function statusForRealBlock(t,block){
    const day=block.day;
    const start=block.start;
    const end=block.end;

    if(!t.labor || !t.labor.days.includes(day) ||
       mins(start)<mins(t.labor.start) || mins(end)>mins(t.labor.end)){
      return {kind:"off",label:"Fuera de jornada",events:[]};
    }

    // Cualquier cruce con una clase hace que el bloque completo no sea disponible.
    const exact=D.exactEvents.filter(e =>
      e.teacher===t.name &&
      e.day===day &&
      eventOverlaps(e,start,end)
    );
    if(exact.length){
      return {kind:"busy",label:"En clase",events:exact};
    }

    const maybe=D.tentativeEvents.filter(e =>
      e.teachers.includes(t.name) &&
      e.day===day &&
      eventOverlaps(e,start,end)
    );
    if(maybe.length){
      return {kind:"maybe",label:"Por confirmar",events:maybe};
    }

    return {kind:"free",label:"Disponible",events:[]};
  }

  function cellDetail(status){
    if(status.kind==="busy"){
      const unique=new Map();
      status.events.forEach(e=>{
        const key=`${e.section}|${e.course}|${e.subject}|${e.start}|${e.end}`;
        unique.set(key,e);
      });
      return [...unique.values()].map(e=>
        `${e.course} · ${e.subject}<small>${e.section} · ${fmt(e.start)}–${fmt(e.end)}</small>`
      ).join("<br>");
    }
    if(status.kind==="maybe"){
      return status.events.map(e=>
        `${e.course} · ${e.subject}<small>${e.section}</small>`
      ).join("<br>");
    }
    return status.kind==="free"
      ? "Sin clase identificada en este bloque lectivo"
      : "Bloque fuera de la jornada registrada";
  }

  function renderFreeTeacherWeek(){
    const t=teacherByName(freeTeacherSelect.value || D.teachers[0].name);
    if(!t) return;

    const blocks=realBlocksForTeacher(t);

    let counts={free:0,busy:0,maybe:0,off:0};
    const rows=blocks.map(block=>{
      const status=statusForRealBlock(t,block);
      counts[status.kind]++;
      return {block,status};
    });

    freeTeacherSummary.innerHTML=`
      <div class="free-teacher-summary__item"><strong>${counts.free}</strong><span>Bloques disponibles</span></div>
      <div class="free-teacher-summary__item"><strong>${counts.busy}</strong><span>Bloques en clase</span></div>
      <div class="free-teacher-summary__item"><strong>${counts.maybe}</strong><span>Por confirmar</span></div>
      <div class="free-teacher-summary__item"><strong>${counts.off}</strong><span>Fuera de jornada</span></div>
    `;

    // Tabla semanal vertical: cada fila es un bloque real de un día concreto.
    // Evita crear celdas artificiales para horarios que no existen ese día.
    freeTeacherHead.innerHTML=`
      <tr>
        <th>Día</th>
        <th>Franja real</th>
        <th>Sección</th>
        <th>Estado</th>
        <th>Curso / asignatura</th>
      </tr>`;

    let previousDay="";
    freeTeacherBody.innerHTML=rows.map(({block,status})=>{
      const dayCell=block.day===previousDay ? "" : block.day;
      previousDay=block.day;
      return `<tr>
        <td class="day-col">${esc(dayCell)}</td>
        <td class="time-col">${esc(fmt(block.start))} – ${esc(fmt(block.end))}</td>
        <td>${esc(block.sections.join(" · "))}</td>
        <td>
          <div class="free-cell free-cell--${status.kind}">
            <strong>${esc(status.label)}</strong>
          </div>
        </td>
        <td class="detail-col">${cellDetail(status)}</td>
      </tr>`;
    }).join("");

    freeTeacherMobile.innerHTML=DAYS.map(day=>{
      const dayRows=rows.filter(r=>r.block.day===day);
      if(!dayRows.length) return "";
      return `<article class="mobile-day">
        <h3>${esc(day)}</h3>
        <div class="mobile-day__list">
          ${dayRows.map(({block,status})=>`
            <div class="mobile-real-block">
              <div class="mobile-real-block__head">
                <strong>${esc(fmt(block.start))} – ${esc(fmt(block.end))}</strong>
                <span>${esc(block.sections.join(" · "))}</span>
              </div>
              <div class="free-cell free-cell--${status.kind}">
                <strong>${esc(status.label)}</strong>
                <small>${cellDetail(status)}</small>
              </div>
            </div>
          `).join("")}
        </div>
      </article>`;
    }).join("");
  }

  freeTeacherSelect.addEventListener("change",renderFreeTeacherWeek);

  freeTeacherSelect.value=initial;
  renderQuick();
  renderTeacher(initial);
  renderTeacherTimetable();
  renderFreeTeacherWeek();
})();
