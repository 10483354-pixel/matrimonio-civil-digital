const $ = id => document.getElementById(id);

let expedientes = JSON.parse(localStorage.getItem("mc_expedientes") || "[]");
let docsLocales = JSON.parse(localStorage.getItem("mc_docs") || "[]");
let mesActual = new Date();

/* MUNICIPALIDADES */
const municipalidades = {
  "Lima Metropolitana": { tipo:"especificos", requisitos:[
    "Partida o certificado de nacimiento conforme al procedimiento",
    "Documentos de identidad de ambos contrayentes",
    "Declaración jurada de domicilio",
    "Declaración jurada de estado civil",
    "Dos testigos mayores de edad",
    "Certificado médico y consejería preventiva",
    "Solicitud / pliego matrimonial"
  ]},
  "Cajamarca": { tipo:"especificos", requisitos:[
    "Partidas o certificados de nacimiento certificados y vigentes",
    "Copias simples de documentos de identidad de los contrayentes",
    "Certificado de domicilio para residente de Cajamarca",
    "Declaración jurada de estado civil con huella biométrica",
    "Dos testigos mayores de edad que no sean familiares y conozcan a los contrayentes",
    "Certificado médico",
    "Consejería preventiva sobre ETS/VIH"
  ]}
};

const requisitosReferenciales = [
  "Partida o certificado de nacimiento según el procedimiento de la municipalidad",
  "Documento de identidad de ambos contrayentes",
  "Declaración jurada de domicilio",
  "Declaración jurada de estado civil",
  "Dos testigos mayores de edad",
  "Certificado médico y/o consejería, según corresponda",
  "Solicitud o pliego matrimonial"
];

const docsOficiales = [
 {id:"solicitud",tipo:"oficial",icon:"📄",nombre:"Solicitud de matrimonio civil",desc:"Formato referencial de solicitud",url:"https://www.gob.pe/"},
 {id:"domicilio",tipo:"oficial",icon:"🏠",nombre:"Declaración jurada de domicilio",desc:"Declaración relacionada con domicilio",url:"https://www.gob.pe/"},
 {id:"civil",tipo:"oficial",icon:"📋",nombre:"Declaración jurada de estado civil",desc:"Declaración del estado civil",url:"https://www.gob.pe/"},
 {id:"testigos",tipo:"oficial",icon:"👥",nombre:"Declaración jurada de testigos",desc:"Formato publicado por Municipalidad de Lince",url:"https://www.gob.pe/institucion/munilince/informes-publicaciones/2508880-formato-de-declaracion-jurada-de-testigos-para-matrimonio-civil"},
 {id:"puntualidad",tipo:"oficial",icon:"⏱️",nombre:"Compromiso de puntualidad",desc:"Documento referencial",url:"https://www.gob.pe/"},
 {id:"consanguinidad",tipo:"oficial",icon:"🧾",nombre:"Declaración de no consanguinidad",desc:"Aplicable según el caso",url:"https://www.gob.pe/"}
];

function mostrarSeccion(id){
 document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));
 document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
 $(id)?.classList.add("active");
 document.querySelector(`[data-section="${id}"]`)?.classList.add("active");
 window.scrollTo({top:0,behavior:"smooth"});
 if(id==="requisitos") cargarRequisitos();
 if(id==="documentos") renderDocumentos();
 if(id==="inicio") actualizarStats();
}
document.querySelectorAll(".nav-item").forEach(n=>n.addEventListener("click",()=>mostrarSeccion(n.dataset.section)));

function toast(msg){
 $("toast").textContent=msg;$("toast").style.display="block";
 clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$("toast").style.display="none",2600);
}
function generarCodigo(){return "MC-"+new Date().getFullYear()+"-"+String(expedientes.length+1).padStart(6,"0")}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function escapeAttr(s){return String(s).replace(/'/g,"\\'")}
function getActual(){return expedientes[expedientes.length-1]}

$("formSolicitud").addEventListener("submit",e=>{
 e.preventDefault();
 const data={
  codigo:generarCodigo(),municipalidad:$("municipalidad").value,modalidad:$("modalidad").value,
  fecha:$("fecha").value,hora:$("hora").value,email:$("email").value,tipoTramite:$("tipoTramite").value,
  c1:{tipo:$("tipoDoc1").value,doc:$("doc1").value,nombres:$("nom1").value,apellidos:$("ape1").value,civil:$("civil1").value,nac:$("nac1").value,dom:$("dom1").value},
  c2:{tipo:$("tipoDoc2").value,doc:$("doc2").value,nombres:$("nom2").value,apellidos:$("ape2").value,civil:$("civil2").value,nac:$("nac2").value,dom:$("dom2").value},
  testigos:[{nombre:$("testigo1").value,doc:$("docTestigo1").value},{nombre:$("testigo2").value,doc:$("docTestigo2").value}],
  estado:"Solicitud registrada",creado:new Date().toLocaleString("es-PE")
 };
 expedientes.push(data);localStorage.setItem("mc_expedientes",JSON.stringify(expedientes));
 $("buscarCodigo").value=data.codigo;toast("Expediente "+data.codigo+" generado correctamente");
 actualizarStats();cargarRequisitos();mostrarSeccion("seguimiento");buscarExpediente();
});

function actualizarStats(){
 $("statExpedientes").textContent=expedientes.length;
 $("statDocumentos").textContent=docsLocales.length;
 $("statCeremonias").textContent=expedientes.filter(x=>x.fecha).length;
}

function renderDocumentos(filter="todos"){
 const all=[...docsOficiales,...docsLocales.map((d,i)=>({...d,id:"local"+i,tipo:"local"}))];
 const list=filter==="todos"?all:all.filter(x=>x.tipo===filter);
 $("documentList").innerHTML=list.map(d=>`
  <div class="doc"><div class="doc-icon">${d.icon||"📎"}</div>
   <div class="doc-main"><strong>${escapeHtml(d.nombre)}</strong><small>${escapeHtml(d.desc||"Archivo cargado")}</small></div>
   <div class="doc-actions">
    ${d.url?`<button class="mini primary-mini" onclick="abrirDocumento('${d.url}')">Abrir</button><button class="mini" onclick="vistaDocumento('${d.url}','${escapeAttr(d.nombre)}')">Vista</button>`:`<button class="mini primary-mini" onclick="previsualizarLocal(${docsLocales.indexOf(d)})">Vista</button>`}
   </div>
  </div>`).join("");
}
function abrirDocumento(url){window.open(url,"_blank","noopener")}
function vistaDocumento(url,nombre){
 $("modalContent").innerHTML=`<h3 style="margin-bottom:12px">${escapeHtml(nombre)}</h3><iframe src="${url}" title="${escapeHtml(nombre)}"></iframe><p style="font-size:11px;color:#71848f;margin-top:8px">Si el portal oficial no permite incrustar el documento, utiliza “Abrir” para verlo en una nueva pestaña.</p>`;
 $("modal").classList.add("show");
}
function cerrarModal(){$("modal").classList.remove("show")}
function previsualizarLocal(i){
 const d=docsLocales[i];
 $("modalContent").innerHTML=`<h3>${escapeHtml(d.nombre)}</h3><p style="margin:12px 0;color:#687d89">Archivo registrado: <b>${escapeHtml(d.fileName)}</b></p><p style="font-size:12px;color:#8a9aa4">En esta versión académica se conserva la ficha del archivo en localStorage.</p>`;
 $("modal").classList.add("show");
}
$("modal").addEventListener("click",e=>{if(e.target.id==="modal")cerrarModal()});
document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderDocumentos(b.dataset.filter)}));
$("archivoInput").addEventListener("change",e=>{
 const f=e.target.files[0];if(!f)return;
 docsLocales.push({nombre:f.name,desc:"Documento cargado por el usuario",fileName:f.name,icon:"📎"});
 localStorage.setItem("mc_docs",JSON.stringify(docsLocales));renderDocumentos();actualizarStats();toast("Documento registrado: "+f.name);e.target.value="";
});

function cargarRequisitos(){
 const m=$("municipalidad").value;const tipo=$("tipoTramite").value;
 const info=municipalidades[m]||{tipo:"referenciales"};
 let req=info.requisitos?[...info.requisitos]:[...requisitosReferenciales];
 if(tipo==="Divorciado(a)")req.push("Documentación que acredite el divorcio, según corresponda");
 if(tipo==="Viudo(a)")req.push("Documentación adicional correspondiente a la condición de viudez");
 if(tipo==="Contrayente extranjero")req.push("Documentación adicional exigida al contrayente extranjero");
 $("reqMunicipalidad").textContent=m+" · "+tipo+(info.tipo==="referenciales"?" · Requisitos referenciales":" · Referencia específica");
 $("requirementsList").innerHTML=req.map(r=>`<label class="check-item"><input type="checkbox" onchange="actualizarChecklist()"><span><strong>${escapeHtml(r)}</strong><small>${info.tipo==="referenciales"?"Referencia general; verificar requisitos oficiales de la municipalidad.":"Marcar cuando esté disponible para la simulación."}</small></span></label>`).join("");
 actualizarChecklist();
}
function actualizarChecklist(){
 const boxes=[...document.querySelectorAll("#requirementsList input")],done=boxes.filter(x=>x.checked).length,total=boxes.length;
 $("reqCount").textContent=`${done} / ${total}`;$("reqProgress").style.width=(total?done/total*100:0)+"%";
}
["municipalidad","tipoTramite"].forEach(id=>$(id).addEventListener("change",cargarRequisitos));

function buscarExpediente(){
 const code=$("buscarCodigo").value.trim().toUpperCase();const e=expedientes.find(x=>x.codigo===code)||getActual();
 if(!e){$("seguimientoResultado").innerHTML=`<div class="result-card"><b>No se encontró el expediente.</b><p style="font-size:12px;color:#778b96;margin-top:5px">Verifica el código generado.</p></div>`;return}
 $("buscarCodigo").value=e.codigo;
 $("seguimientoResultado").innerHTML=`<div class="result-card"><div class="result-top"><div><span class="eyebrow dark">EXPEDIENTE DIGITAL</span><div class="code">${e.codigo}</div><small>${escapeHtml(e.c1.nombres+" "+e.c1.apellidos)} · ${escapeHtml(e.c2.nombres+" "+e.c2.apellidos)}</small></div><span class="badge">● ${e.estado}</span></div><p style="margin-top:12px;font-size:12px;color:#72848e">Municipalidad: <b>${escapeHtml(e.municipalidad)}</b> · Modalidad: <b>${escapeHtml(e.modalidad)}</b> · Fecha preferente: <b>${escapeHtml(e.fecha)}</b></p><div class="result-flow"><div class="done">✓ Solicitud</div><div class="done">✓ Documentos</div><div>03 Evaluación</div><div>04 Edicto</div><div>05 Programación</div><div>06 Ceremonia</div></div></div>`;
}

function renderCalendar(){
 const y=mesActual.getFullYear(),m=mesActual.getMonth();
 $("mesTitulo").textContent=mesActual.toLocaleDateString("es-PE",{month:"long",year:"numeric"}).replace(/^./,c=>c.toUpperCase());
 const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();let h="";
 for(let i=0;i<first;i++)h+='<div class="day empty"></div>';
 for(let d=1;d<=days;d++)h+=`<button class="day" onclick="seleccionarFecha(${y},${m},${d})">${d}</button>`;
 $("calendar").innerHTML=h;
}
function cambiarMes(n){mesActual.setMonth(mesActual.getMonth()+n);renderCalendar()}
function seleccionarFecha(y,m,d){
 const date=new Date(y,m,d);const txt=date.toLocaleDateString("es-PE",{weekday:"long",year:"numeric",month:"long",day:"numeric"});
 $("fechaSeleccionada").textContent="Fecha seleccionada: "+txt;toast("Fecha referencial seleccionada");
}

renderCalendar();renderDocumentos();actualizarStats();cargarRequisitos();
