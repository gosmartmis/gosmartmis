import{r,s as y}from"./index-DCgxXzl4.js";const E=["Monday","Tuesday","Wednesday","Thursday","Friday"],q=(u,s)=>{const[o,n]=r.useState(null),[b,c]=r.useState(!0),[h,d]=r.useState(null),m=async()=>{if(!u||!s){c(!1);return}try{c(!0),d(null);const{data:a,error:f}=await y.from("timetables").select(`
          id,
          day_of_week,
          period_number,
          start_time,
          end_time,
          is_break,
          is_published,
          class_id,
          subject_id,
          teacher_id,
          classes:class_id (name),
          subjects:subject_id (name),
          profiles:teacher_id (full_name)
        `).eq("school_id",u).eq("class_id",s).eq("is_published",!0).order("day_of_week",{ascending:!0}).order("period_number",{ascending:!0});if(f)throw f;if(!a||a.length===0){n(null);return}const i=a.map(t=>({id:t.id,day_of_week:t.day_of_week,period_number:t.period_number,start_time:t.start_time,end_time:t.end_time,is_break:t.is_break??!1,is_published:t.is_published??!1,class_id:t.class_id,class_name:t.classes?.name??"Unknown",subject_id:t.subject_id,subject_name:t.subjects?.name??null,teacher_id:t.teacher_id,teacher_name:t.profiles?.full_name??null})),_=i[0]?.class_name??"Unknown",p=E.map(t=>({day:t,periods:i.filter(l=>l.day_of_week===t).sort((l,g)=>l.period_number-g.period_number)})),k=i.filter(t=>!t.is_break),e=new Set(k.map(t=>t.subject_name).filter(Boolean)).size;n({classId:s,className:_,schedule:p,isPublished:!0,totalPeriods:k.length,uniqueSubjects:e})}catch(a){d(a instanceof Error?a.message:"Failed to fetch timetable")}finally{c(!1)}};return r.useEffect(()=>{m()},[u,s]),{timetable:o,loading:b,error:h,refetch:m}},P=(u,s)=>{const[o,n]=r.useState(null),[b,c]=r.useState(!0),[h,d]=r.useState(null),m=async()=>{if(!u||!s){c(!1);return}try{c(!0),d(null);const{data:a,error:f}=await y.from("timetables").select(`
          id,
          day_of_week,
          period_number,
          start_time,
          end_time,
          is_break,
          is_published,
          class_id,
          subject_id,
          teacher_id,
          classes:class_id (name),
          subjects:subject_id (name),
          profiles:teacher_id (full_name)
        `).eq("school_id",u).eq("teacher_id",s).order("day_of_week",{ascending:!0}).order("period_number",{ascending:!0});if(f)throw f;if(!a||a.length===0){n(null);return}const i=a.map(e=>({id:e.id,day_of_week:e.day_of_week,period_number:e.period_number,start_time:e.start_time,end_time:e.end_time,is_break:e.is_break??!1,is_published:e.is_published??!1,class_id:e.class_id,class_name:e.classes?.name??"Unknown",subject_id:e.subject_id,subject_name:e.subjects?.name??null,teacher_id:e.teacher_id,teacher_name:e.profiles?.full_name??null})),_=E.map(e=>({day:e,periods:i.filter(t=>t.day_of_week===e).sort((t,l)=>t.period_number-l.period_number)})),p=i.filter(e=>!e.is_break),k=new Set(p.map(e=>e.class_id)).size;n({classId:s,className:i[0]?.teacher_name??"Teacher",schedule:_,isPublished:!0,totalPeriods:p.length,uniqueSubjects:k})}catch(a){d(a instanceof Error?a.message:"Failed to fetch timetable")}finally{c(!1)}};return r.useEffect(()=>{m()},[u,s]),{timetable:o,loading:b,error:h,refetch:m}};function T(u){const{teacherId:s,classId:o,schoolId:n}=u,[b,c]=r.useState([]),[h,d]=r.useState(!0),[m,a]=r.useState(!1),[f,i]=r.useState(null),_=r.useCallback(async()=>{if(!n){d(!1);return}try{d(!0),i(null);let e=y.from("holiday_packages").select(`
          *,
          classes:class_id ( name ),
          subjects:subject_id ( name ),
          profiles:teacher_id ( full_name )
        `).eq("school_id",n).eq("is_published",!0).order("created_at",{ascending:!1});s&&(e=e.eq("teacher_id",s)),o&&!s&&(e=e.eq("class_id",o));const{data:t,error:l}=await e;if(l)throw l;const g=(t||[]).map(j=>({...j,class_name:j.classes?.name??null,subject_name:j.subjects?.name??null,teacher_name:j.profiles?.full_name??null}));c(g)}catch(e){i(e instanceof Error?e.message:"Failed to load holiday packages")}finally{d(!1)}},[n,s,o]);return r.useEffect(()=>{_()},[_]),{packages:b,loading:h,error:f,creating:m,createPackage:async e=>{if(!n||!s)return!1;try{a(!0);const{error:t}=await y.from("holiday_packages").insert({school_id:n,teacher_id:s,class_id:e.class_id,subject_id:e.subject_id,title:e.title,description:e.description,due_date:e.due_date||null,attachment_name:e.attachment_name||null,attachment_url:e.attachment_url||null,is_published:!0});if(t)throw t;return await _(),!0}catch(t){return i(t instanceof Error?t.message:"Failed to create package"),!1}finally{a(!1)}},deletePackage:async e=>{try{const{error:t}=await y.from("holiday_packages").delete().eq("id",e);if(t)throw t;return c(l=>l.filter(g=>g.id!==e)),!0}catch(t){return i(t instanceof Error?t.message:"Failed to delete package"),!1}},refetch:_}}export{T as a,q as b,P as u};
//# sourceMappingURL=useHolidayPackages-DHcWYv9q.js.map
