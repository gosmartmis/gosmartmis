import{r as t,s as p}from"./index-DCgxXzl4.js";const b=(n,r,c)=>{const[l,m]=t.useState([]),[u,a]=t.useState(!0),[h,o]=t.useState(null),i=async()=>{if(!n){a(!1);return}try{a(!0),o(null);let e=p.from("teacher_assignments").select(`
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
        `).eq("school_id",n);r&&(e=e.eq("teacher_id",r));const{data:_,error:f}=await e;if(f)throw f;const g=(_||[]).map(s=>({...s,class_name:s.classes?.name||"Unknown",subject_name:s.subjects?.name||"Unknown",teacher_name:s.profiles?.full_name||"Unknown"}));m(g)}catch(e){o(e instanceof Error?e.message:"Failed to fetch teacher assignments"),console.error("Error fetching teacher assignments:",e)}finally{a(!1)}};return t.useEffect(()=>{i()},[n,r,c]),{assignments:l,loading:u,error:h,refetch:i}};export{b as u};
//# sourceMappingURL=useTeacherAssignments-DjfHAUs_.js.map
