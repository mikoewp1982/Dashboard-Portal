export interface UserClaims {
    role: 'super_admin' | 'school_admin' | 'teacher' | 'student';
    schoolId: string;
    classId?: string;
}
