import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './components/Home-page';
import HomePageAdmin from './components/HomePageAdmin';
import InstructorHomePage from './components/InstructureHomepage';
import StudentRegistrationForm from './components/StudentRegistration';
import MaterialLists from './components/MaterialLists';
import AdminList from './components/AdminList';
import StudentHomePage from './components/StudentHomePage';
import Login from './components/Login';
import InstructorRegistration from './components/InstructureRegistration';
import CourseDetailPage from './components/CourseDetailPage';

import ViewInstructureDetail from './components/ViewInstructureDetail';
import ScheduleClassForm from './components/ScheduleClassForm';
import AssignmentsList from './components/AssignmentsList';
import CourseNotificationsPage from './components/CourseNotificationsPage';
import UploadAssignment from './components/UploadAssignment';
import AssignmentSubmissions from './components/AssignmentSubmissions';

import ManageStudents from './components/ManageStudents';
import ManageInstructors from './components/ManageInstructures';
import UploadMaterial from './components/UploadMaterial';
import AddCourse from './components/AddCourses';
import AdminRegister from './components/AdminRegister';
import ManageCourses from './components/ManageCourses';
import CoursePage from './components/CoursePage';
import AssignInstructure from './components/AssignInstructure';
import StudentsTranscript from './components/StudentsTranscript';


function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/StudentRegistration" element={<StudentRegistrationForm />} />
        <Route path="/InstructureRegistration" element={<InstructorRegistration />} />
        <Route path="/Login" element={<Login />} />
       
        <Route path="/AdminList" element={<AdminList />} />
        <Route path="/ViewInstructureDetail" element={<ViewInstructureDetail />} />
        <Route path="/MaterialLists" element={<MaterialLists />} />
        <Route path="/AdminRegister" element={<AdminRegister />} />
        <Route path="/AssignInstructure" element={<AssignInstructure />} />
        <Route path="/HomePageAdmin" element={<HomePageAdmin />} />
        <Route path="/ManageStudents" element={<ManageStudents />} />
        <Route path="/AddCourses" element={<AddCourse />} />
        <Route path="/ManageCourses" element={<ManageCourses />} />
        <Route path="/ManageInstructures" element={<ManageInstructors />} />
        <Route path="/InstructureHomepage" element={<InstructorHomePage />} />
          <Route path="/StudentHomePage" element={<StudentHomePage />} />
        <Route path="/courses/:courseId" element={<CoursePage />}/>

        {/* Course Detail with nested routes */}
        <Route path="/instructor/courses/:courseId" element={<CourseDetailPage />}>
          <Route path="upload-material" element={<UploadMaterial />} />
              <Route path="upload-assignment" element={<UploadAssignment />} />
          <Route path="schedule-class" element={<ScheduleClassForm />} />
           <Route path="view-submitted" element={<AssignmentSubmissions />} />
         <Route path="notifications" element={<CourseNotificationsPage />}
/>
          <Route path="assignment-list" element={<AssignmentsList />} />
          <Route path="UploadAssignment" element={<UploadAssignment />} />
          <Route path="material-list" element={<MaterialLists/>} />
          <Route path="students-transcript" element={<StudentsTranscript/>} />
          {/* You can add a default overview route like this: */}
          {/* <Route index element={<div>Course Overview</div>} /> */}
        </Route>

        {/* Instructor dashboard with nested routes */}
        <Route path="/Instructor" element={<InstructorHomePage />}>
       
          <Route index element={<ManageInstructors />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
