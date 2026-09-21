import { useEffect, useState } from 'react';
import PublicPage from './PublicPage';
import ProjectCard from '../../components/public/ProjectCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { projectsApi } from '../../api/projects.api';
import { useUi } from '../../context/UiContext';
import { PROJECT_IMAGES, SITE_IMAGES } from '../../data/siteMedia';

export default function Projects() {
  const { text } = useUi();
  const [items, setItems] = useState(null);
  useEffect(() => { projectsApi.publicList().then(setItems).catch(() => setItems([])); }, []);
  return <PublicPage image={SITE_IMAGES.projects} eyebrow={text.projectsPage.eyebrow} title={text.projectsPage.title} intro={text.projectsPage.intro}>
    {items === null ? <Loader/> : items.length ? (
      <div className="cards-3">
        {items.map((item, index) => (
          <ProjectCard
            key={item.id}
            project={item}
            image={PROJECT_IMAGES[index % PROJECT_IMAGES.length]}
            delay={Math.min(index, 4) * 65}
          />
        ))}
      </div>
    ) : (
      <EmptyState title={text.projectsPage.empty}/>
    )}
  </PublicPage>;
}
