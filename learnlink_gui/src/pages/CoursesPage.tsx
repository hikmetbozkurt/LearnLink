import React, { useState, useEffect, useContext } from "react";
import CourseSidebar from "../components/Course/CourseSidebar";
import CourseArea from "../components/Course/CourseArea";
import CreateCourseModal from "../components/Course/CreateCourseModal";
import { NotificationContext } from "../contexts/NotificationContext";
import { Course } from "../types/course";
import { courseService } from "../services/courseService";
import "../styles/pages/courses.css";
import { debounce } from "lodash";
import { Outlet, useLocation } from "react-router-dom";

const CoursesPage = () => {
  const { showNotification } = useContext(NotificationContext);
  const [activeTab, setActiveTab] = useState<"dashboard" | "myCourses">(
    "dashboard"
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [courseAvatar, setCourseAvatar] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // activeTab değiştiğinde filteredCourses'u güncelle
    const currentList = activeTab === "dashboard" ? courses : myCourses;
    setFilteredCourses(currentList);
  }, [activeTab, courses, myCourses]);

  useEffect(() => {
    // Her tab değişiminde ilgili kursları yükle
    loadCourses();
  }, [activeTab]);

  useEffect(() => {
    // Location state'inde refresh varsa kursları yeniden yükle
    if (location.state?.refresh) {
      loadCourses();
      // State'i temizle
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadCourses = async () => {
    try {
      if (activeTab === "dashboard") {
        const allCourses = await courseService.getAllCourses();
        setCourses(allCourses);
        setFilteredCourses(allCourses);
      } else {
        const userCourses = await courseService.getMyCourses();
        setMyCourses(userCourses);
        setFilteredCourses(userCourses);
      }
    } catch (error) {
      console.error("Error loading courses:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await courseService.createCourse({
        title: formData.title,
        description: formData.description,
      });

      if (response.success) {
        showNotification("Course created successfully", "success");
        setShowCreateModal(false);
        // Kursları yeniden yükle
        loadCourses();
      } else {
        showNotification(response.error || "Failed to create course", "error");
      }
    } catch (error) {
      console.error("Error creating course:", error);
      showNotification("Failed to create course", "error");
    } finally {
      setIsLoading(false);
      // Form verilerini sıfırla
      setFormData({
        title: "",
        description: "",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCourseAvatar(e.target.files[0]);
    }
  };

  const handleJoinCourse = async (courseId: string) => {
    try {
      const result = await courseService.joinCourse(courseId);
      if (result.success) {
        showNotification("Successfully joined the course!", "success");
        loadCourses();
      } else {
        showNotification(result.error || "Failed to join course", "error");
      }
    } catch (error) {
      console.error("Error joining course:", error);
      showNotification("An unexpected error occurred", "error");
    }
  };

  const debouncedSearch = debounce((query: string) => {
    const currentList = activeTab === "dashboard" ? courses : myCourses;
    const filtered = currentList.filter((course) =>
      course.title.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCourses(filtered);
  }, 500);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  // Context değerlerini hazırla
  const contextValue = {
    courses,
    activeTab,
    onJoinCourse: handleJoinCourse,
    onCourseJoined: loadCourses,
    filteredCourses,
  };

  return (
    <div className="courses-container">
      <CourseSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onCreateCourse={() => setShowCreateModal(true)}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        myCourses={myCourses}
      />

      <div className="course-content-area">
        <Outlet context={contextValue} />
      </div>

      {showCreateModal && (
        <CreateCourseModal
          formData={formData}
          onInputChange={handleInputChange}
          onSubmit={handleCreateCourse}
          onClose={() => {
            setShowCreateModal(false);
            setFormData({ title: "", description: "" }); // Modal kapanınca formu sıfırla
          }}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default CoursesPage;
