import{r as t,s as E}from"./index-KD-SY-um.js";const g=(s,a)=>{const[l,f]=t.useState([]),[i,r]=t.useState(!0),[d,n]=t.useState(null),o=async()=>{if(!s){r(!1);return}try{r(!0),n(null);let e=E.from("students").select(`
          *,
          classes:class_id (
            name
          )
        `).eq("school_id",s).order("full_name",{ascending:!0});const{data:m,error:c}=await e;if(c)throw c;const h=(m||[]).map(u=>({...u,class_name:u.classes?.name||"N/A"}));f(h)}catch(e){n(e instanceof Error?e.message:"Failed to fetch students"),console.error("Error fetching students:",e)}finally{r(!1)}};return t.useEffect(()=>{o()},[s,a]),{students:l,loading:i,error:d,refetch:o}};export{g as u};
//# sourceMappingURL=useStudents-zQfJBWKS.js.map
