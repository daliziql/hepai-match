"use client";

import { useEffect, useMemo, useState } from "react";

type Profile = {
  gender: "男" | "女";
  age: number;
  city: string;
  height: number;
  appearance: number;
  education: number;
  income: number;
  savings: number;
  career: number;
  family: number;
};

type SoftKey = "appearance" | "career" | "family";
type WeightItem = { key: keyof Profile; label: string; weight: number; enabled: boolean };
type TargetKind = "balanced" | "compatible" | "aspirational";
type DimensionResult = WeightItem & { score:number; level:string };
type ScoreResult = { score:number; percentile:number; dimensions:DimensionResult[]; groups:Array<(typeof modelGroups)[number] & {weight:number;score:number}> };

const profileSeed: Profile = { gender:"男", age:29, city:"新一线", height:178, appearance:7, education:4, income:28, savings:45, career:7, family:7 };
const targetSeeds: Record<TargetKind, Profile> = {
  compatible: { gender:"女", age:28, city:"新一线", height:162, appearance:6, education:2, income:12, savings:18, career:6, family:7 },
  balanced: { gender:"女", age:27, city:"新一线", height:165, appearance:7, education:3, income:20, savings:30, career:7, family:7 },
  aspirational: { gender:"女", age:26, city:"一线", height:168, appearance:9, education:4, income:35, savings:60, career:9, family:8 },
};

const weightsSeed: WeightItem[] = [
  {key:"appearance",label:"外在与仪表",weight:23,enabled:true},{key:"height",label:"身高",weight:17,enabled:true},
  {key:"income",label:"当前收入",weight:17,enabled:true},{key:"savings",label:"存款与资产",weight:13,enabled:true},
  {key:"age",label:"年龄适配",weight:9,enabled:true},{key:"family",label:"家庭支持",weight:8,enabled:true},
  {key:"career",label:"职业发展",weight:7,enabled:true},{key:"education",label:"教育背景",weight:6,enabled:true},
];

const modelGroups = [
  {key:"looks",label:"外观条件",keys:["appearance","height"] as (keyof Profile)[],color:"#4298a0"},
  {key:"finance",label:"经济条件",keys:["income","savings","family"] as (keyof Profile)[],color:"#826aa8"},
  {key:"other",label:"其他条件",keys:["age","career","education"] as (keyof Profile)[],color:"#d6a640"},
];

const educationLabels = ["高中及以下","大专","普通本科","重点本科","硕士","博士"];
const newFirstTierCities = ["成都","杭州","重庆","武汉","苏州","西安","南京","长沙","郑州","天津","合肥","青岛","东莞","宁波","佛山"];
const softMeta: Record<SoftKey, { label:string; short:string; descriptions:string[] }> = {
  appearance: { label:"外在与仪表", short:"大众审美与实际第一印象", descriptions:[
    "未评分。","1分｜明显低于普遍审美，五官、体态与仪表多方面都较弱，通常会被直观评价为“丑”。","2分｜低于普遍审美，即使保持整洁，第一印象仍容易被认为不好看。","3分｜整体偏弱，但通过发型、体态和穿搭改善后可以明显提升。","4分｜略低于普通人水平，干净得体时不至于突兀，但外貌通常不是优势。","5分｜典型普通人，外貌不加分也不明显减分，辨识度较低。","6分｜普通人中较顺眼的一档，整体协调、耐看，偶尔会得到好看评价。","7分｜公认的帅或美，在同事、同学等熟人圈中通常属于外貌优势者。","8分｜很帅或很美，五官、体态与仪表都突出，在多数场合容易被注意。","9分｜顶帅或顶美，接近明星、模特级别，在现实人群中非常少见。","10分｜理论极值：外貌、体态、气质和镜头表现几乎无短板，现实中基本不存在。"] },
  career: { label:"职业发展", short:"结合城市、稳定性、收入与成长性", descriptions:[
    "未评分。","1分｜无稳定工作或长期失业，收入中断且没有清晰职业计划。","2分｜临时工、频繁换岗或高度不稳定的小微企业岗位，收入明显低于当地水平。","3分｜普通小型民企或基础服务岗位，能够就业，但稳定性、收入和成长空间都有限。","4分｜稳定的中小企业、技术或行政岗位，收入接近当地普通水平，有一定可积累能力。","5分｜成熟民企正式员工、专业技术岗位，或三四线城市一般国企/事业单位岗位，稳定与收入较均衡。","6分｜优质国企正式岗、地方银行稳定岗、低线城市公务员/事业编，或中型科技企业骨干，抗风险能力较好。","7分｜新一线/二线城市公务员或优质事业编、银行核心正式岗、大型国企骨干，或IT大厂成熟专业岗。","8分｜一线城市优质公务员/事业单位核心岗、央国企或银行总部骨干；IT大厂高级岗可达此级，但需扣除裁员风险。","9分｜一线城市核心体制内/央国企重要岗位，兼具稀缺平台、明确晋升与优厚保障；头部银行核心高薪岗也可接近。","10分｜一线城市极稀缺的核心体制内或中央级平台：稳定、待遇、资源、发展和社会认可几乎同时拉满，现实中极少。"] },
  family: { label:"家庭支持", short:"氛围、负担与边界", descriptions:[
    "原生家庭存在严重冲突或债务负担，且缺乏必要的个人边界。","家庭干预强、负担重，个人很难独立做出婚恋与生活决策。","有较明显的经济或照护压力，对亲密关系可能产生持续影响。","家庭支持有限但基本可控，边界问题仍需要双方耐心协商。","家庭关系和负担处于普通水平，重大事项可以进行基本沟通。","家庭氛围相对友善，经济与养老安排较清晰，尊重个人选择。","能提供稳定情感支持，家庭边界清晰，现实负担相对较轻。","双方父母开明、关系健康，能在需要时提供适度实际支持。","家庭资源、氛围和边界都很理想，对新家庭形成明显助力。","家庭高度和谐且保障充分，能够长期尊重并支持小家庭独立。","极其理想的支持系统：温暖、开明、低负担且资源充足。"] },
};

const targetInfo: Record<TargetKind,{name:string;tag:string;copy:string;color:string}> = {
  compatible:{name:"轻松相处型",tag:"更容易",copy:"条件门槛更包容，侧重稳定性与现实适配。",color:"mint"},
  balanced:{name:"势均力敌型",tag:"较均衡",copy:"综合条件接近，现实基础与关系质量兼顾。",color:"purple"},
  aspirational:{name:"理想进阶型",tag:"更有挑战",copy:"多项条件突出，候选更稀缺，匹配难度更高。",color:"yellow"},
};

function clamp(v:number,min=0,max=100){return Math.min(max,Math.max(min,v))}
function interpolate(value:number,points:Array<[number,number]>){if(value<=points[0][0])return points[0][1];for(let i=1;i<points.length;i++){const[a,b]=points[i-1],[c,d]=points[i];if(value<=c)return b+(d-b)*(value-a)/(c-a)}return points.at(-1)?.[1]??50}
function rarityLevel(score:number){if(score<20)return"较常见";if(score<40)return"普通偏下";if(score<60)return"人群中段";if(score<75)return"开始稀缺";if(score<90)return"比较少见";if(score<97)return"非常稀缺";return"极少见"}
function metricScore(key:keyof Profile,p:Profile){const v=p[key];if(typeof v!=="number")return 50;switch(key){
  case"age":{const ideal=p.gender==="男"?30:27,diff=Math.abs(p.age-ideal);return interpolate(diff,[[0,82],[2,74],[5,52],[8,30],[12,12],[18,3]])}
  case"height":{const mean=p.gender==="男"?169.7:158,sd=p.gender==="男"?6.5:6,z=(p.height-mean)/sd;return clamp(100/(1+Math.exp(-1.702*z)),2,99)}
  case"appearance":return interpolate(p.appearance,[[1,1],[2,3],[3,10],[4,25],[5,50],[6,72],[7,90],[8,98],[9,99.7],[10,99.95]])
  case"education":return [22,38,58,72,86,95][p.education]??50
  case"income":{const baseline={"一线":18,"新一线":12,"二线":9,"三线及以下":7}[p.city]??10;return interpolate(p.income/baseline,[[0,2],[.25,5],[.5,18],[.75,35],[1,50],[1.5,72],[2,85],[3,95],[5,99],[8,99.8]])}
  case"savings":{const baseline={"一线":30,"新一线":20,"二线":15,"三线及以下":10}[p.city]??15;return interpolate(p.savings/baseline,[[0,2],[.2,6],[.5,20],[1,50],[2,80],[3,92],[5,98],[8,99.5]])}
  case"career":return interpolate(p.career,[[1,2],[2,6],[3,13],[4,25],[5,42],[6,60],[7,75],[8,87],[9,95],[10,99]])
  case"family":return interpolate(p.family,[[1,2],[2,6],[3,14],[4,28],[5,45],[6,61],[7,76],[8,88],[9,96],[10,99.5]])
  default:return 50
}}
function nonlinearAggregate(items:Array<{score:number;weight:number}>){if(!items.length)return 0;const total=items.reduce((s,x)=>s+x.weight,0)||1;const average=items.reduce((s,x)=>s+x.score*x.weight,0)/total;const sorted=[...items].sort((a,b)=>b.score-a.score);const standout=Math.max(0,sorted[0].score-average);const tail=Math.max(0,sorted[0].score-85);const balance=Math.max(0,Math.min(...items.map(x=>x.score))-60);return clamp(average+standout*.16+tail*.1+balance*.04,1,99.8)}
function calculate(p:Profile,weights:WeightItem[]):ScoreResult{const active=weights.filter(w=>w.enabled),total=active.reduce((s,w)=>s+w.weight,0)||1;const dimensions:DimensionResult[]=active.map(w=>{const score=Math.round(metricScore(w.key,p));return{...w,score,level:rarityLevel(score)}});const groups=modelGroups.map(group=>{const items=dimensions.filter(item=>group.keys.includes(item.key)),weight=items.reduce((s,item)=>s+item.weight,0),groupScore=Math.round(nonlinearAggregate(items));return{...group,weight:weight/total*100,score:groupScore}});const groupInputs=groups.filter(g=>g.weight>0).map(g=>({score:g.score,weight:g.weight}));const strongest=dimensions.reduce((best,item)=>item.score>best.score?item:best,dimensions[0]??{score:50} as DimensionResult);const base=nonlinearAggregate(groupInputs);const rareAdvantage=Math.max(0,strongest.score-92)*.12;const score=Math.round(clamp(base+rareAdvantage,1,99));return{score,percentile:score,dimensions,groups}}
function difficulty(own:ScoreResult,target:ScoreResult,targetProfile:Profile){const gap=target.score-own.score;const ownMap=Object.fromEntries(own.dimensions.map(x=>[x.key,x.score]));const targetMap=Object.fromEntries(target.dimensions.map(x=>[x.key,x.score]));const criticalGap=Math.max(0,(targetMap.appearance??50)-(ownMap.appearance??50),(targetMap.income??50)-(ownMap.income??50));const appearanceBarrier=[0,0,0,0,0,0,8,20,50,66,80][targetProfile.appearance]??0;const incomeRarity=targetMap.income??50;const incomeBarrier=interpolate(incomeRarity,[[0,0],[50,0],[72,6],[85,15],[95,28],[99,45],[100,60]]);const gapPressure=gap>=0?gap*1.15:gap*.3;const pressure=gapPressure+criticalGap*.28+appearanceBarrier+incomeBarrier+Math.max(0,target.score-82)*.2;const levels=[
  {max:2,label:"容易",step:6,copy:"目标条件较常见，也落在你的现实选择范围内。"},
  {max:13,label:"较易",step:5,copy:"目标不算稀缺，双方条件有较大的相遇与互选空间。"},
  {max:25,label:"有挑战",step:4,copy:"目标已出现稀缺项，需要偏好契合或个人优势来提高机会。"},
  {max:39,label:"较难",step:3,copy:"目标的突出条件明显收窄了候选范围，匹配需要更多运气。"},
  {max:55,label:"很难",step:2,copy:"目标集中在少见人群，单靠其他普通条件很难补足差距。"},
  {max:Infinity,label:"基本不可能",step:1,copy:"目标包含极稀缺条件，现实候选很少，双向选择机会也会更低。"},
];return levels.find(x=>pressure<=x.max)??levels.at(-1)!}

function InfoDot({text}:{text:string}){return <span className="info-dot" tabIndex={0} aria-label={text}>i<span>{text}</span></span>}
function itemInfo(key:keyof Profile|null,p:Profile,weights:WeightItem[]){if(!key)return"该项用于确定比较人群，让结果更贴近你的现实环境，本身不直接计分。";const w=weights.find(x=>x.key===key);if(!w?.enabled)return"该项当前已停用，不参与综合稀缺度计算。";const score=Math.round(metricScore(key,p)),level=rarityLevel(score);const basis=key==="height"?" 会结合同性别平均身高判断相对位置。":key==="income"||key==="savings"?` 会结合${p.city}的现实水平判断相对位置。`:"";return`当前位于“${level}”区间，约超过同口径人群的 ${score}%。${basis}模型会按曲线计算影响，不是简单乘以固定权重。`}

function NumberField({label,value,onChange,unit,min=0,max=999,info}:{label:string;value:number;onChange:(v:number)=>void;unit?:string;min?:number;max?:number;info?:string}){
  const[draft,setDraft]=useState(String(value));
  useEffect(()=>setDraft(String(value)),[value]);
  const change=(raw:string)=>{setDraft(raw);if(raw!==""){const parsed=Number(raw);if(Number.isFinite(parsed))onChange(parsed)}};
  const finish=()=>{if(draft===""){setDraft(String(value));return}const parsed=Number(draft);const next=Math.min(max,Math.max(min,Number.isFinite(parsed)?parsed:value));setDraft(String(next));if(next!==value)onChange(next)};
  return <label className="field"><span className="field-label">{label}{info&&<InfoDot text={info}/>}</span><div><input aria-label={label} type="number" inputMode="numeric" step="1" value={draft} min={min} max={max} onFocus={e=>e.currentTarget.select()} onChange={e=>change(e.target.value)} onBlur={finish}/>{unit&&<em>{unit}</em>}</div></label>
}

function SoftSlider({kind,value,onChange,city}:{kind:SoftKey;value:number;onChange:(v:number)=>void;city:string}){const meta=softMeta[kind];return <div className="soft-card"><div className="soft-title"><div><b>{meta.label}</b><span>{meta.short}</span></div><strong>{value}<small>/10</small></strong></div><input aria-label={`${meta.label}评分`} type="range" min="1" max="10" step="1" value={value} onChange={e=>onChange(Number(e.target.value))}/><div className="scale"><span>1</span><span>5</span><span>10</span></div><p key={value}><i>当前等级</i>{meta.descriptions[value]}</p>{kind==="appearance"&&<small className="model-caveat">仅描述大众审美中的相对位置，不代表个人价值。</small>}{kind==="career"&&<small className="model-caveat">当前选择：{city}城市口径。IT大厂等高薪岗位会同时考虑波动和裁员风险。</small>}</div>}

function Basics({profile,onChange,weights}:{profile:Profile;onChange:(p:Profile)=>void;weights:WeightItem[]}){const set=<K extends keyof Profile>(k:K,v:Profile[K])=>onChange({...profile,[k]:v});return <><div className="basics-grid"><label className="field"><span className="field-label">性别<InfoDot text={itemInfo(null,profile,weights)}/></span><select value={profile.gender} onChange={e=>set("gender",e.target.value as Profile["gender"])}><option>男</option><option>女</option></select></label><NumberField label="年龄" value={profile.age} min={18} max={65} unit="岁" info={itemInfo("age",profile,weights)} onChange={v=>set("age",v)}/><label className="field"><span className="field-label">常住城市<InfoDot text={itemInfo(null,profile,weights)}/></span><select value={profile.city} onChange={e=>set("city",e.target.value)}><option value="一线">一线（北上广深）</option><option value="新一线">新一线（15城）</option><option>二线</option><option>三线及以下</option></select></label><NumberField label="身高" value={profile.height} min={140} max={210} unit="cm" info={itemInfo("height",profile,weights)} onChange={v=>set("height",v)}/><label className="field"><span className="field-label">最高学历<InfoDot text={itemInfo("education",profile,weights)}/></span><select value={profile.education} onChange={e=>set("education",Number(e.target.value))}>{educationLabels.map((x,i)=><option value={i} key={x}>{x}</option>)}</select></label><NumberField label="税前年收入" value={profile.income} unit="万" info={itemInfo("income",profile,weights)} onChange={v=>set("income",v)}/><NumberField label="可支配储蓄" value={profile.savings} unit="万" info={itemInfo("savings",profile,weights)} onChange={v=>set("savings",v)}/></div>{profile.city==="新一线"&&<div className="city-explain"><b>新一线 · 2025榜单口径</b><span>{newFirstTierCities.join("、")}</span><small>这是第一财经的商业魅力榜单，并非行政级别。2026年报告已停止发布城市排名与分级。</small><a href="https://www.yicai.com/news/102638963.html" target="_blank" rel="noreferrer">查看来源</a></div>}</>}

function ResultHero({profile,weights}:{profile:Profile;weights:WeightItem[]}){const result=useMemo(()=>calculate(profile,weights),[profile,weights]);const[showParts,setShowParts]=useState(false);const top=[...result.dimensions].sort((a,b)=>b.score-a.score)[0];return <section className="result-hero"><div className="result-copy"><span className="mini-label">你的条件画像</span><h1>{result.percentile>=90?"少数优势型":result.percentile>=72?"优势清晰型":result.percentile>=50?"稳健平衡型":"成长潜力型"}</h1><p>这个分数代表你的条件在人群中的稀缺程度。<b>{top?.label}</b>是当前最突出的稀缺优势。</p><div className="result-actions"><button onClick={()=>document.querySelector("#profile-editor")?.scrollIntoView({behavior:"smooth"})}>调整我的资料</button><span>比较口径：{profile.gender} · {profile.city} · 相近婚恋阶段</span></div></div><div className="result-visual"><div className="orbit one"/><div className="orbit two"/><div className="avatar-shape"><i/><b/><span/></div></div><div className={`score-summary ${showParts?"parts-view":""}`}>{showParts?<><div className="score-mode-head"><small>稀缺度拆解</small><button onClick={()=>setShowParts(false)}>← 返回总分</button></div><div className="group-scores">{result.groups.map(group=><div key={group.key} style={{borderColor:group.color}}><span>{group.label}<small>影响度 {group.weight.toFixed(0)}%</small></span><strong>{group.score}</strong></div>)}</div><div className="score-parts">{result.dimensions.map(item=><div key={item.key}><span>{item.label}<small>{item.level}</small></span><i><b style={{width:`${item.score}%`}}/></i><strong>{item.score}</strong></div>)}</div><p className="formula-note">分数越高，人群越少；突出单项会被识别，普通项不会简单抵消。</p></>:<><div className="score-mode-head"><small>综合稀缺度</small><button onClick={()=>setShowParts(true)}>查看分项 →</button></div><strong>{result.score}</strong><span>/100</span><div className="percent-bar"><i style={{width:`${result.percentile}%`}}/></div><p>约超过同口径人群的 <b>{result.percentile}%</b></p><small className="score-explain">越接近 100，现实中达到相似条件的人越少</small></>}</div></section>}

function ProfileEditor({profile,onChange,weights}:{profile:Profile;onChange:(p:Profile)=>void;weights:WeightItem[]}){const set=(k:SoftKey,v:number)=>onChange({...profile,[k]:v});return <section className="editor-section" id="profile-editor"><div className="section-heading"><span>01</span><div><h2>完善你的条件画像</h2><p>拖动评分时，对应等级的具体行为描述会同步变化。</p></div></div><div className="white-panel"><h3>基础条件</h3><Basics profile={profile} onChange={onChange} weights={weights}/></div><div className="soft-grid">{(Object.keys(softMeta) as SoftKey[]).map(k=><SoftSlider key={k} kind={k} value={profile[k]} city={profile.city} onChange={v=>set(k,v)}/>)}</div></section>}

function TargetEditor({target,onChange,own,weights}:{target:Profile;onChange:(p:Profile)=>void;own:ScoreResult;weights:WeightItem[]}){const result=calculate(target,weights),level=difficulty(own,result,target);const set=(k:SoftKey,v:number)=>onChange({...target,[k]:v});return <div className="target-editor"><div className="target-live"><div><span>目标稀缺度</span><strong>{result.score}</strong><small>/100</small></div><div className="difficulty"><span>匹配难度</span><b>{level.label}</b><div>{[1,2,3,4,5,6].map(n=><i className={n<=level.step?"on":""} key={n}/>)}</div></div><p>{level.copy}</p></div><div className="white-panel"><h3>调整目标基础条件</h3><Basics profile={target} onChange={onChange} weights={weights}/></div><div className="target-soft">{(Object.keys(softMeta) as SoftKey[]).map(k=><SoftSlider key={k} kind={k} value={target[k]} city={target.city} onChange={v=>set(k,v)}/>)}</div></div>}

function SettingsPage({weights,setWeights,saved,onSave}:{weights:WeightItem[];setWeights:(next:WeightItem[])=>void;saved:boolean;onSave:()=>void}){const active=weights.filter(w=>w.enabled),total=active.reduce((s,w)=>s+w.weight,0)||1;return <section className="settings-page"><div className="page-intro"><span className="mini-label">模型设置 · V0.4</span><h1>用曲线描述稀缺，而不是简单加分</h1><p>每一项先换算成人群位置，再识别整体均衡与单项优势。越接近顶端，分数增长越慢、现实人数越少。</p></div><div className="curve-summary"><div><b>5 → 50</b><span>普通水平</span></div><i>→</i><div><b>6 → 72</b><span>开始有挑战</span></div><i>→</i><div><b>7 → 90</b><span>明显稀缺</span></div><i>→</i><div><b>8 → 98</b><span>极少数</span></div></div><div className="group-rule-cards">{modelGroups.map(group=>{const weight=active.filter(w=>group.keys.includes(w.key)).reduce((s,w)=>s+w.weight,0)/total*100;return <div key={group.key} style={{borderTopColor:group.color}}><span>{group.label}</span><strong>{weight.toFixed(0)}%</strong><small>模型影响度 · {group.keys.map(key=>weights.find(w=>w.key===key)?.label).filter(Boolean).join(" · ")}</small></div>})}</div><div className="settings-card"><div className="settings-head"><div><h2>子项影响度</h2><p>影响度决定曲线对综合结果的敏感程度，不再等于固定得分占比</p></div><button onClick={onSave}>{saved?"已保存 ✓":"保存设置"}</button></div>{weights.map((w,i)=><div className={`weight-line ${!w.enabled?"off":""}`} key={w.key}><span>{w.label}</span><input aria-label={`${w.label}影响度`} type="range" min="1" max="30" value={w.weight} onChange={e=>setWeights(weights.map((x,n)=>n===i?{...x,weight:Number(e.target.value)}:x))}/><strong>{w.weight}</strong><button aria-label={`${w.enabled?"停用":"启用"}${w.label}`} className={w.enabled?"toggle on":"toggle"} onClick={()=>setWeights(weights.map((x,n)=>n===i?{...x,enabled:!x.enabled}:x))}><i/></button></div>)}</div><div className="research-card"><div><span>模型逻辑</span><h2>先定位人群，再判断匹配难度</h2></div><ul><li><b>独立稀缺曲线</b><p>外表、收入、存款等分别按自己的分布换算。普通到优秀不是匀速增长，越往上越少见。</p></li><li><b>优势不会被抹平</b><p>综合条件好会得到稳定高分；某一项极其突出时也会被识别，但不能无限抵消明显短板。</p></li><li><b>难度单独判断</b><p>匹配不是比较两个总分。目标的外表与收入越稀缺，候选越少，即使总分相近也可能很难。</p></li></ul><div className="source-links"><a href="https://doi.org/10.1016/j.chbr.2024.100579" target="_blank" rel="noreferrer">在线约会行为研究</a><a href="https://arxiv.org/abs/1401.5710" target="_blank" rel="noreferrer">中国婚恋网站行为研究</a><a href="https://www.nhc.gov.cn/xcs/c100122/202012/175301a949ce481a9c1a9a2b393c8e49.shtml" target="_blank" rel="noreferrer">身高基线</a><a href="https://www.stats.gov.cn/xxgk/sjfb/zxfb2020/202601/t20260119_1962321.html" target="_blank" rel="noreferrer">收入基线</a></div><p className="assumption-note">当前结果用于直观比较，并非人口普查结论。城市、年龄和婚恋状态的公开联合分布有限，因此收入与存款曲线仍属于可持续校准的估计模型。</p></div></section>}

export default function Home(){const[page,setPage]=useState<"profile"|"match"|"settings">("profile");const[profile,setProfile]=useState(profileSeed);const[targets,setTargets]=useState(targetSeeds);const[active,setActive]=useState<TargetKind>("balanced");const[weights,setWeights]=useState(weightsSeed);const[saved,setSaved]=useState(false);useEffect(()=>{const raw=localStorage.getItem("hepan-config-v4");if(raw)try{const old=JSON.parse(raw) as WeightItem[];setWeights(weightsSeed.map(seed=>{const stored=old.find(item=>item.key===seed.key);return stored?{...seed,weight:stored.weight,enabled:stored.enabled}:seed}))}catch{}},[]);const own=calculate(profile,weights);const updateTarget=(p:Profile)=>setTargets({...targets,[active]:p});const save=()=>{localStorage.setItem("hepan-config-v4",JSON.stringify(weights));setSaved(true);setTimeout(()=>setSaved(false),1600)};
  return <main><header><button className="logo" onClick={()=>setPage("profile")}><i>H</i><span>Hepan<small>条件匹配实验室</small></span></button><nav><button className={page==="profile"?"active":""} onClick={()=>setPage("profile")}>我的画像</button><button className={page==="match"?"active":""} onClick={()=>setPage("match")}>目标推荐</button><button className={page==="settings"?"active":""} onClick={()=>setPage("settings")}>模型设置</button></nav><div className="privacy"><i/>资料仅保存在本机</div></header>
  {page==="profile"&&<><ResultHero profile={profile} weights={weights}/><ProfileEditor profile={profile} onChange={setProfile} weights={weights}/></>}
  {page==="match"&&<section className="match-page"><div className="page-intro"><span className="mini-label">基于你的 {own.score} 稀缺度生成</span><h1>三个值得考虑的目标画像</h1><p>选择一种方向，再自由移动对方的各项指标。目标稀缺度和匹配难度会实时变化。</p></div><div className="target-cards">{(Object.keys(targetInfo) as TargetKind[]).map(k=>{const r=calculate(targets[k],weights),info=targetInfo[k],d=difficulty(own,r,targets[k]);return <button key={k} className={`${info.color} ${active===k?"selected":""}`} onClick={()=>setActive(k)}><span>{info.tag}</span><div className="target-icon"><i/><b/></div><h2>{info.name}</h2><p>{info.copy}</p><div className="target-score"><strong>{r.score}</strong><small>稀缺度</small><em>{d.label}</em></div></button>})}</div><TargetEditor target={targets[active]} onChange={updateTarget} own={own} weights={weights}/></section>}
  {page==="settings"&&<SettingsPage weights={weights} setWeights={setWeights} saved={saved} onSave={save}/>} {/* settings view */}
  <footer><b>Hepan</b><span>结果用于自我认知和偏好梳理，不代表人的价值。</span><a href="https://www.16personalities.com/free-personality-test" target="_blank" rel="noreferrer">界面风格参考</a></footer></main>}
