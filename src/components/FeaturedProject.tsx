import { getPublicAssetUrl } from '../lib/assets';
import type { FeaturedProject as FeaturedProjectData, PortfolioLabels } from '../types/portfolio';
import { SectionContent } from './SectionContent';
import { SectionLabel } from './SectionLabel';

function WebIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path d="M3.6 9h16.8M3.6 15h16.8" />
      <path d="M12 3c2.1 2.4 3.15 5.4 3.15 9S14.1 18.6 12 21" />
      <path d="M12 3c-2.1 2.4-3.15 5.4-3.15 9S9.9 18.6 12 21" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

type ProjectLinksProps = {
  featuredProject: FeaturedProjectData;
  labels: PortfolioLabels;
};

function ProjectLinks({ featuredProject, labels }: ProjectLinksProps) {
  return (
    <div className="flex flex-wrap gap-4">
      <a className="inline-flex items-center gap-2 border-b border-slate-300 pb-1 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-700 hover:text-slate-700" href={featuredProject.liveUrl} target="_blank" rel="noreferrer">
        <WebIcon />
        {labels.liveLink}
        <span aria-hidden="true">→</span>
      </a>
      <a className="inline-flex items-center gap-2 border-b border-slate-300 pb-1 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-700 hover:text-slate-700" href={featuredProject.repositoryUrl} target="_blank" rel="noreferrer">
        <GitHubIcon />
        {labels.repositoryLink}
        <span aria-hidden="true">→</span>
      </a>
    </div>
  );
}

type FeaturedProjectProps = {
  featuredProject: FeaturedProjectData;
  labels: PortfolioLabels;
};

export function FeaturedProject({ featuredProject, labels }: FeaturedProjectProps) {
  return (
    <section id="projects" className="border-b border-slate-200 py-12" aria-labelledby="project-title">
      <SectionLabel icon="featuredProject">{labels.featuredProjectSection}</SectionLabel>

      <SectionContent>
        <article className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.7fr)] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 id="project-title" className="m-0 text-3xl font-semibold tracking-[-0.05em] text-slate-700">
                {featuredProject.name}
              </h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
                {labels.online}
              </span>
            </div>

            <p className="mt-2 max-w-[540px] text-base leading-7 text-slate-600">
              {featuredProject.summary}
            </p>

            {featuredProject.caseStudy?.length ? (
              <div className="mt-5 space-y-4 text-sm leading-7 text-slate-600">
                {featuredProject.caseStudy.map((paragraph) => (
                  <p key={paragraph} className="m-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}

            <ul className="mt-7 grid grid-cols-2 gap-x-5 gap-y-3 p-0 max-[720px]:grid-cols-1" aria-label={`${featuredProject.name} features`}>
              {featuredProject.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-8 max-[720px]:hidden">
              <ProjectLinks featuredProject={featuredProject} labels={labels} />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl" aria-label={`${featuredProject.name} project preview`}>
            <img className="block w-full rounded-2xl" src={getPublicAssetUrl(featuredProject.image.src)} alt={featuredProject.image.alt} loading="lazy" decoding="async" />
          </div>

          <div className="hidden max-[720px]:block">
            <ProjectLinks featuredProject={featuredProject} labels={labels} />
          </div>
        </article>
      </SectionContent>
    </section>
  );
}
