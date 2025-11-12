import React, { useCallback, useEffect, useState } from "react";
import { Applicant } from "@/pages/result/[job_u_id]";
import { Avatar } from "@/components/ui/avatar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import axios, { AxiosError, AxiosResponse } from "axios";

/* ----------------------------- Type definitions ---------------------------- */

interface College {
  name?: string;
  branch?: string;
  degree?: string;
  start_date?: string;
  end_date?: string;
  [key: string]: string | undefined;
}

interface Project {
  u_id: string;
  project_title: string;
  short_description: string;
  tech_stack: string[];
  time_duration: {
    start_date: string;
    end_date: string;
    duration_in_months: number;
  };
  relevancy: number;
}

interface ProfessionalExperience {
  u_id: string;
  organization: string;
  role: string;
  tech_stack: string[];
  short_description: string;
  time_duration: {
    start_date: string;
    end_date: string;
    duration_in_months: number;
  };
  relevance: number;
}

/* --------------------------------- Components -------------------------------- */

interface CollegeTabProps {
  college: College;
}

const CollegeTab: React.FC<CollegeTabProps> = ({ college }) => {
  const COLLEGE_KEY_MAPPING = new Map<string, string>([
    ["name", "Name"],
    ["branch", "Branch"],
    ["degree", "Degree"],
    ["start_date", "Start"],
    ["end_date", "End"],
  ]);

  if (!college) return <div className="p-3">No college info available</div>;

  return (
    <div className="flex flex-col gap-3 p-3">
      {Object.keys(college).map((key) => {
        const value = college[key];
        if (!value) return null;
        return (
          <div key={key} className="flex flex-row justify-start gap-2 items-center">
            <p className="text-sm font-semibold">{COLLEGE_KEY_MAPPING.get(key) ?? key}:</p>
            <p className="text-xs text-gray-600">{value}</p>
          </div>
        );
      })}
    </div>
  );
};

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  return (
    <div className="border rounded-lg border-grey-600 flex flex-col w-full p-1">
      <div className="flex flex-row justify-between w-full border-b-2 border-gray-600">
        <p className="font-semibold text-sm">{project.project_title}</p>
        <p className="text-sm text-gray-800">
          {project.time_duration.start_date} - {project.time_duration.end_date}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs text-gray-600">{project.short_description}</p>
        <div className="flex flex-row flex-wrap gap-1 items-center">
          {project.tech_stack.map((tech: string, index: number) => (
            <div
              key={tech ?? `tech-${index}`}
              className="bg-gray-300 rounded-md p-[0.2px] text-center whitespace-nowrap text-xs h-fit"
            >
              {tech}
            </div>
          ))}
        </div>
      </div>
      <p className="w-full text-center text-xs font-semibold">Relevance: {project.relevancy}</p>
    </div>
  );
};

interface ProjectTabProps {
  projects: Project[];
}

const ProjectTab: React.FC<ProjectTabProps> = ({ projects }) => {
  return (
    <div className="flex flex-col gap-3 p-3">
      {projects.map((project: Project) => (
        <ProjectCard key={project.u_id ?? `proj-${project.project_title}`} project={project} />
      ))}
    </div>
  );
};

interface ProfessionalExperienceCardProps {
  professionalExperience: ProfessionalExperience;
}

const ProfessionalExperienceCard: React.FC<ProfessionalExperienceCardProps> = ({ professionalExperience }) => {
  return (
    <div className="border rounded-lg border-grey-600 flex flex-col w-full p-1">
      <div className="flex flex-row justify-between w-full border-b-2 border-gray-600">
        <div className="flex flex-col">
          <p className="font-semibold text-md">{professionalExperience.role}</p>
          <p className="font-semibold text-sm text-gray-500">{professionalExperience.organization}</p>
        </div>
        <p className="text-sm text-gray-800">
          {professionalExperience.time_duration.start_date} - {professionalExperience.time_duration.end_date}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs text-gray-600">{professionalExperience.short_description}</p>
        <div className="flex flex-row flex-wrap gap-1 items-center">
          {professionalExperience.tech_stack.map((tech: string, idx: number) => (
            <div key={tech ?? `pe-tech-${idx}`} className="bg-gray-300 rounded-md p-[0.2px] text-center whitespace-nowrap text-xs h-fit">
              {tech}
            </div>
          ))}
        </div>
      </div>
      <p className="w-full text-center text-xs font-semibold">Relevance: {professionalExperience.relevance}</p>
    </div>
  );
};

interface ProfessionalExperienceTabProps {
  professionalExperiences: ProfessionalExperience[];
}

const ProfessionalExperienceTab: React.FC<ProfessionalExperienceTabProps> = ({ professionalExperiences }) => {
  return (
    <div className="flex flex-col gap-3 p-3">
      {professionalExperiences.map((pe) => (
        <ProfessionalExperienceCard key={pe.u_id ?? `pe-${pe.organization}`} professionalExperience={pe} />
      ))}
    </div>
  );
};

/* ----------------------------- Main dialog component ---------------------------- */
/*
  Note: the component signature below accepts the Applicant object directly.
*/
export const ApplicantDetailDialog: React.FC<Applicant> = (applicant) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [professionalExperiences, setProfessionalExperiences] = useState<ProfessionalExperience[]>([]);
  const [college, setCollege] = useState<College | undefined>(undefined);

  // extract stable applicantId to use in dependencies
  const applicantId = (applicant as any)?.u_id ?? null;

  // make getDetails stable and only depend on isOpen + applicantId
  const getDetails = useCallback(() => {
    if (!isOpen || !applicantId) return;

    // NOTE: in containerized environment, use backend service name instead of 127.0.0.1
    const url = `http://127.0.0.1:8000/api/get-applicant-summary/${applicantId}/`;
    axios
      .get(url)
      .then((response: AxiosResponse) => {
        const data = response.data;
        setCollege(data.college);
        setProjects(Array.isArray(data.projects) ? [...data.projects] : []);
        setProfessionalExperiences(Array.isArray(data.professional_experiences) ? [...data.professional_experiences] : []);
      })
      .catch((error: AxiosError) => {
        console.error("Failed to fetch applicant details:", error);
      });
  }, [isOpen, applicantId]);

  // call getDetails when dialog opens
  useEffect(() => {
    getDetails();
  }, [getDetails]);

  return (
    <Dialog
      onOpenChange={() => {
        setIsOpen(!isOpen);
      }}
    >
      <DialogTrigger asChild>
        <a className="text-blue-600 hover:underline cursor-pointer">View Details</a>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="bg-[#F2F4F7] text-[#667085] font-semibold rounded-full my-auto text-center p-3 text-xs">
                {(applicant.name?.split(" ")[0] ?? "")[0] ?? ""}
                {(applicant.name ? applicant.name.split(" ")[applicant.name.split(" ").length - 1] : "")?.[0] ?? ""}
              </Avatar>

              <div className="flex flex-col justify-between">
                <p className="font-semibold text-lg">{applicant.name}</p>
                <p className="text-sm text-gray-400">{applicant.email}</p>
              </div>
            </div>
          </DialogTitle>

          <DialogClose />
        </DialogHeader>

        <Tabs defaultValue="college" className="w-full ">
          <TabsList>
            <TabsTrigger value="college">College</TabsTrigger>
            <TabsTrigger value="project">Project</TabsTrigger>
            <TabsTrigger value="profexp">Professional Experience</TabsTrigger>
          </TabsList>

          <TabsContent value="college" className="h-fit">
            {college ? <CollegeTab college={college} /> : <p>Please Wait</p>}
          </TabsContent>

          <TabsContent value="project" className="h-[400px] overflow-y-scroll">
            {projects && projects.length > 0 ? <ProjectTab projects={projects} /> : <p>Please Wait</p>}
          </TabsContent>

          <TabsContent value="profexp" className="h-[400px] overflow-y-scroll">
            {professionalExperiences && professionalExperiences.length > 0 ? (
              <ProfessionalExperienceTab professionalExperiences={professionalExperiences} />
            ) : (
              <p>Loading...</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicantDetailDialog;
