#!/usr/bin/env node

import inquirer from"inquirer";import checkbox from"@inquirer/checkbox";import select from"@inquirer/select";import fs from"fs";import os from"os";import axios from"axios";import figlet from"figlet";const FOLDER_PATH=os.homedir()+"/.argem",FILE_NAME="token.json";function isAuthenticated(){if(!fs.existsSync(FOLDER_PATH+"/"+FILE_NAME))return!1;try{var e=fs.readFileSync(FOLDER_PATH+"/"+FILE_NAME,{encoding:"utf8",flag:"r"}),t=JSON.parse(e)["token"];return!!t}catch(e){return!1}}function persistToken(e){fs.mkdirSync(FOLDER_PATH,{recursive:!0}),fs.writeFileSync(FOLDER_PATH+"/"+FILE_NAME,JSON.stringify({})),fs.writeFileSync(FOLDER_PATH+"/"+FILE_NAME,JSON.stringify(e))}function purgeToken(){fs.unlinkSync(FOLDER_PATH+"/"+FILE_NAME)}function readToken(){try{var e=fs.readFileSync(FOLDER_PATH+"/"+FILE_NAME,{encoding:"utf8",flag:"r"});return JSON.parse(e)}catch(e){return null}}const getLocalizedDay=e=>e.toLocaleString("tr-TR",{weekday:"long"}),getFullDate=e=>{return new Date(e).toLocaleDateString("tr-TR",{year:"numeric",month:"long",day:"numeric"})};function getDateString(e){e=new Date(e);return getFullDate(e)+", "+getLocalizedDay(e)}function doubleDigit(e){return("00"+e).slice(-2)}class ArgemService{constructor(){this.baseURL="https://argem-sancaktepe.hepsiburada.com/api",this.init()}init=()=>{var e=readToken();this.instance=axios.create({headers:{Authorization:"Bearer "+e?.token,Cookie:e?.Cookie},validateStatus:e=>200<=e&&e<=500&&401!==e&&400!==e,baseURL:this.baseURL})};login=(e,t)=>this.instance.post("/auth/sign_in",{email:e,password:t});getTimeTable=()=>this.instance.post("/",{query:"GetAllPersonalWorklogs",payload:{filter:[],sorting:[]}});getActivities=()=>this.instance.post("/",{query:"ActivitySelectList",payload:{label:"",wid:""}});getProjects=()=>this.instance.post("/",{query:"ProjectSelectListByTeam",payload:{label:"2023-07-19",wid:966406}});enterWorklog=(e,t,i,a)=>this.instance.post("/",{query:"updateWorklogDetail",payload:{data:[{item_status:"1",activity:t,project:i,holiday:null,total_time:a,statement:null}],id:e}})}var ArgemService$1=new ArgemService;async function welcome(){figlet("Argem   CLI",(e,t)=>{console.log(t)}),isAuthenticated()||await loginPrompt();var{timesheet:e,selectedDates:t}=await timeTablePropmt();return e.length?t.length?void await enterWorkLogPropmt(e,t,await activityPropmpt(),await projectPrompt()):console.log("Hiçbir tarih seçmediniz!"):console.log("Eksik gününüz bulunmamaktadır 🎉🎉🎉")}async function loginPrompt(){console.log("Giriş yapmanız gerekiyor.");var e=(await inquirer.prompt({name:"email",type:"input",message:"E-mail adresi:"}))["email"],t=(await inquirer.prompt({name:"password",type:"password",message:"Şifre:"}))["password"],{data:{token:e},headers:t}=await ArgemService$1.login(e,t);persistToken({token:e,Cookie:t["set-cookie"]?.join(";")}),ArgemService$1.init()}async function timeTablePropmt(){let t=null;try{var i=(await ArgemService$1.getTimeTable())["data"]["data"];t=i?.filter((e,t)=>!e.completed&&t<100)}catch(e){401===e.response.status&&(purgeToken(),await loginPrompt(),t=null,{data:i}=(await ArgemService$1.getTimeTable())["data"],t=i?.filter((e,t)=>!e.completed&&t<100))}return t?.length?(i=await checkbox({message:"Doldurmak istediğiniz günleri seçiniz: ",choices:t.map(e=>({name:getDateString(e.date),value:e.id}))}),{timesheet:t,selectedDates:i}):{timesheet:t,selectedDates:null}}async function activityPropmpt(){var e=(await ArgemService$1.getActivities())["data"]["data"],e=e?.filter(e=>1===e.item_status);return await select({message:"Aktivite seçiniz: ",choices:e.map(e=>({name:e.label,value:e.key}))})}async function projectPrompt(){var{data:e}=(await ArgemService$1.getProjects())["data"];return await select({message:"Projenizi seçiniz: ",choices:e.map(e=>({name:e.label,value:e.key}))})}async function enterWorkLogPropmt(a,e,r,n){console.log("\nArgem girişleriniz gerçekleştiriliyor.\n"),e.forEach(async t=>{var e=a.find(e=>e.id===t),i=calculateMissingTime(e.totaltime);await ArgemService$1.enterWorklog(t,r,n,i),console.log(getDateString(e.date)+" mesai girişi tamamlandı. Girilen toplam mesai süresi: "+i)})}function calculateMissingTime(e){e=480-(60*Number(e.split(":")[0])+Number(e.split(":")[1]));return doubleDigit(Math.floor(e/60))+":"+doubleDigit(e%60)}welcome();