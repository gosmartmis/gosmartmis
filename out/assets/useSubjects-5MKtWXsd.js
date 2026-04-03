import{r as s,s as g}from"./index-KD-SY-um.js";const E=(t,a,u)=>{const[l,c]=s.useState([]),[m,n]=s.useState(!0),[i,e]=s.useState(null),o=async()=>{if(!t){n(!1);return}try{n(!0),e(null);let r=g.from("teacher_assignments").select(`
          *,
          classes:class_id (
            name
          ),
          subjects:subject_id (
            name
          ),
          profiles:teacher_id (
            full_name
          )
        `).eq("school_id",t);a&&(r=r.eq("teacher_id",a));const{data:b,error:h}=await r;if(h)throw h;const _=(b||[]).map(f=>({...f,class_name:f.classes?.name||"Unknown",subject_name:f.subjects?.name||"Unknown",teacher_name:f.profiles?.full_name||"Unknown"}));c(_)}catch(r){e(r instanceof Error?r.message:"Failed to fetch teacher assignments"),console.error("Error fetching teacher assignments:",r)}finally{n(!1)}};return s.useEffect(()=>{o()},[t,a,u]),{assignments:l,loading:m,error:i,refetch:o}},d=t=>{const[a,u]=s.useState([]),[l,c]=s.useState(!0),[m,n]=s.useState(null),i=async()=>{if(!t){c(!1);return}try{c(!0),n(null);const{data:e,error:o}=await g.from("subjects").select("*").eq("school_id",t).order("name",{ascending:!0});if(o)throw o;u(e||[])}catch(e){n(e instanceof Error?e.message:"Failed to fetch subjects"),console.error("Error fetching subjects:",e)}finally{c(!1)}};return s.useEffect(()=>{i()},[t]),{subjects:a,loading:l,error:m,refetch:i}};export{d as a,E as u};
//# sourceMappingURL=useSubjects-5MKtWXsd.js.map
