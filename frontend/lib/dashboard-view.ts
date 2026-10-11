/** Dashboard presentation helpers. Unknown figures remain unknown, never zero. */
export function formatObservedNumber(value:number|null, maximumFractionDigits=3){
 return value===null||!Number.isFinite(value)?'—':new Intl.NumberFormat('en-US',{maximumFractionDigits}).format(value);
}
export function summarizeFunding(input:unknown){
 const noData={status:'unavailable' as const,hourlyPct:null as number|null,records:[] as {time:string;hourlyPct:number}[],updatedAt:null as string|null};
 if(!input||typeof input!=='object')return noData;
 const response=input as Record<string,unknown>;
 if(response.status!=='observed' && response.status!=='stale')return noData;
 const raw=Array.isArray(response.records)?response.records:[];
 const records=raw.filter((v):v is {time:string;hourlyPct:number}=>typeof v==='object'&&v!==null&&typeof v.time==='string'&&Number.isFinite(Date.parse(v.time))&&typeof v.hourlyPct==='number'&&Number.isFinite(v.hourlyPct)&&Math.abs(v.hourlyPct)<100).slice(0,24).reverse();
 const latest=response.latest as Record<string,unknown>|undefined;
 const hourlyPct=latest&&typeof latest.hourlyPct==='number'&&Number.isFinite(latest.hourlyPct)?latest.hourlyPct:null;
 const updatedAt=typeof response.fetchedAt==='string'&&Number.isFinite(Date.parse(response.fetchedAt))?response.fetchedAt:null;
 return {status:response.status,hourlyPct,records,updatedAt};
}
export function scalePath(values: number[],width:number,height:number,pad=12){
 if(!values.length)return '';
 const finite=values.filter(Number.isFinite);
 if(finite.length!==values.length)return '';
 const lo=Math.min(...values),hi=Math.max(...values);
 const span=hi-lo||1;
 return values.map((v,i)=>`${i===0?'M':'L'} ${(pad+(i/(values.length-1||1))*(width-2*pad)).toFixed(2)} ${(height-pad-((v-lo)/span)*(height-2*pad)).toFixed(2)}`).join(' ');
}
export function shortSignature(value:string){return `${value.slice(0,5)}…${value.slice(-5)}`}
