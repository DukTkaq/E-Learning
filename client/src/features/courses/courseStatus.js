const EDITABLE_STATUSES = new Set(["Draft", "Rejected"]);

export const canEditCourse = (status) => EDITABLE_STATUSES.has(status);

export const getCourseReadOnlyNotice = (status) => {
  if (status === "Approved") {
    return {
      title: "Approved course is locked.",
      text: "Course information, lessons, quizzes, and questions can no longer be changed.",
    };
  }

  if (status === "Pending") {
    return {
      title: "Course under review.",
      text: "Course content is read-only until Admin finishes reviewing it.",
    };
  }

  if (status === "Hidden") {
    return {
      title: "Hidden course is locked.",
      text: "The course is no longer sold, but enrolled students keep their learning access.",
    };
  }

  return null;
};
