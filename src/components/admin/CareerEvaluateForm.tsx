"use client";

import CareerConfigPanel from "./career/CareerConfigPanel";
import JobEvaluatePanel from "./career/JobEvaluatePanel";
import CvGeneratePanel from "./career/CvGeneratePanel";

export default function CareerEvaluateForm() {
  return (
    <>
      <CareerConfigPanel />
      <JobEvaluatePanel />
      <CvGeneratePanel />
    </>
  );
}
