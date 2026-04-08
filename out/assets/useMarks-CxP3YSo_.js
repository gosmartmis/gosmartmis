import{r as c,s as q}from"./index-DCgxXzl4.js";const v=m=>{const{schoolId:u,classId:_,subjectId:h,termId:g,teacherId:l,studentId:p,status:i}=m,[E,r]=c.useState([]),[b,f]=c.useState(!0),[o,w]=c.useState(null),S=async()=>{if(!u){f(!1);return}try{f(!0),w(null);let e=q.from("marks").select(`
          *,
          students:student_id (
            full_name
          ),
          subjects:subject_id (
            name
          ),
          classes:class_id (
            name
          ),
          profiles:teacher_id (
            full_name
          )
        `).eq("school_id",u).order("created_at",{ascending:!1});_&&(e=e.eq("class_id",_)),h&&(e=e.eq("subject_id",h)),g&&(e=e.eq("term_id",g)),l&&(e=e.eq("teacher_id",l)),p&&(e=e.eq("student_id",p)),i&&(e=e.eq("status",i));const{data:t,error:s}=await e;if(s)throw s;const n=(t||[]).map(a=>({...a,student_name:a.students?.full_name||"Unknown",subject_name:a.subjects?.name||"Unknown",class_name:a.classes?.name||"Unknown",teacher_name:a.profiles?.full_name||"Unknown"}));r(n)}catch(e){w(e instanceof Error?e.message:"Failed to fetch marks"),console.error("Error fetching marks:",e)}finally{f(!1)}},d=async(e,t,s,n)=>{const a={status:t};s&&(a.approved_by=s),n&&(a.remarks=n);const{error:k}=await q.from("marks").update(a).eq("id",e);if(k)throw k;await S()};return c.useEffect(()=>{S()},[u,_,h,g,l,p,i]),{marks:E,loading:b,error:o,refetch:S,updateMarkStatus:d}},M=(m,u)=>{const[_,h]=c.useState(null),[g,l]=c.useState(!0),[p,i]=c.useState(null);return c.useEffect(()=>{(async()=>{if(!m){l(!1);return}try{l(!0),i(null);let r=q.from("marks").select(`
            score,
            max_score,
            status,
            student_id,
            students:student_id (
              full_name
            )
          `).eq("school_id",m);u&&(r=r.eq("term_id",u));const{data:b,error:f}=await r;if(f)throw f;const o=b||[],w=o.length>0?o.reduce((t,s)=>{const n=(Number(s.score)||0)/(Number(s.max_score)||100)*100;return t+n},0)/o.length:0,S=o.filter(t=>t.status==="pending").length,d=new Map;o.forEach(t=>{const s=t.students?.full_name||"Unknown",n=(Number(t.score)||0)/(Number(t.max_score)||100)*100;if(d.has(t.student_id)){const a=d.get(t.student_id);a.total+=n,a.count+=1}else d.set(t.student_id,{name:s,total:n,count:1})});const e=Array.from(d.values()).map(t=>({student_name:t.name,average:t.total/t.count})).sort((t,s)=>s.average-t.average).slice(0,10);h({averageScore:Math.round(w),totalAssessments:o.length,pendingApprovals:S,topPerformers:e})}catch(r){i(r instanceof Error?r.message:"Failed to fetch marks stats"),console.error("Error fetching marks stats:",r)}finally{l(!1)}})()},[m,u]),{stats:_,loading:g,error:p}};export{M as a,v as u};
//# sourceMappingURL=useMarks-CxP3YSo_.js.map
