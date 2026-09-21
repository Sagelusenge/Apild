const content = {
  en: {
    projects: {
      'PRJ-DEMO-001': { name: 'Digital education for young people', description: 'A pilot project introducing digital skills in community schools.', objectives: 'Train young people in digital tools and strengthen teachers’ capacities.' },
      'PRJ-DEMO-002': { name: 'Community health and prevention', description: 'Community awareness and screening in peri-urban areas.', objectives: 'Improve prevention and referral to health facilities.' }
    },
    interventions: {
      'INT-DEMO-001': { title: 'Introduction to digital skills', description: 'First training session for students.', domain_name: 'Education' },
      'INT-DEMO-002': { title: 'Community screening', description: 'Voluntary screening and medical referral.', domain_name: 'Health' }
    },
    articles: {
      'ART-DEMO-001': { title: 'APILD launches its digital education programme', excerpt: 'A new programme supports young people and teachers in the digital transition.', content: 'APILD has launched a pilot digital education programme in several community schools in Lubumbashi.' },
      'ART-DEMO-002': { title: 'A community health campaign close to people', excerpt: 'APILD teams and partners are strengthening prevention in Kipushi.', content: 'The campaign combines awareness-raising, voluntary screening and referrals to partner health facilities.' }
    }
  },
  sw: {
    projects: {
      'PRJ-DEMO-001': { name: 'Elimu ya kidijitali kwa vijana', description: 'Mradi wa majaribio wa kuanzisha ujuzi wa kidijitali katika shule za jamii.', objectives: 'Kuwafundisha vijana zana za kidijitali na kuimarisha uwezo wa walimu.' },
      'PRJ-DEMO-002': { name: 'Afya ya jamii na kinga', description: 'Uhamasishaji na uchunguzi wa jamii katika maeneo ya pembezoni mwa miji.', objectives: 'Kuboresha kinga na rufaa kwa vituo vya afya.' }
    },
    interventions: {
      'INT-DEMO-001': { title: 'Utangulizi wa ujuzi wa kidijitali', description: 'Kikao cha kwanza cha mafunzo kwa wanafunzi.', domain_name: 'Elimu' },
      'INT-DEMO-002': { title: 'Uchunguzi wa jamii', description: 'Uchunguzi wa hiari na rufaa ya matibabu.', domain_name: 'Afya' }
    },
    articles: {
      'ART-DEMO-001': { title: 'APILD yazindua programu yake ya elimu ya kidijitali', excerpt: 'Programu mpya inasaidia vijana na walimu katika mpito wa kidijitali.', content: 'APILD imezindua programu ya majaribio ya elimu ya kidijitali katika shule kadhaa za jamii za Lubumbashi.' },
      'ART-DEMO-002': { title: 'Kampeni ya afya karibu na jamii', excerpt: 'Timu za APILD na washirika zinaimarisha kinga Kipushi.', content: 'Kampeni hii inaunganisha uhamasishaji, uchunguzi wa hiari na rufaa kwa vituo vya afya washirika.' }
    }
  }
};

export function localizeRecord(language, type, record) {
  if (!record || language === 'fr') return record;
  return { ...record, ...(content[language]?.[type]?.[record.reference] || {}) };
}

export function plainText(value) {
  return String(value || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}
