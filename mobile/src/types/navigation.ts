export type RootStackParamList = {
    Welcome: undefined;
    Login: undefined;
    Home: undefined;
    CourseLibrary: undefined;
    CourseDetail: { courseId: string };
    VideoLesson: { courseId: string; moduleId: string };
    Quiz: { courseId: string; moduleId: string };
    Certificate: { courseId: string; score?: number };
    JobsMockup: undefined;
    Progress: undefined;
};