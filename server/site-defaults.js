// Built-in site content. Used to seed the database on first run and as a
// fallback so the site still renders when the database is unreachable.
// Editable content lives in the site_data table after that; this file is
// only the starting point.

module.exports = {
  site: {
    email: 'info@ekoelitesclub.org',
    location: 'Indianapolis, Indiana, USA',
    meeting: 'General meeting: first Sunday of every month',
    historyPhoto: 'images/history.jpg'
  },
  stats: [
    { value: '120+', label: 'ACTIVE MEMBERS' },
    { value: '2021', label: 'ESTABLISHED' },
    { value: '30+', label: 'EVENTS HOSTED' },
    { value: '9', label: 'EXECUTIVE OFFICES' }
  ],
  executives: [
    { office: 'PRESIDENT', slotId: 'exec-president', name: 'Officer Name', photo: 'images/executives/president.jpg', duty: 'Leads the club, presides over meetings, and represents Eko Elites Club Inc. in Indiana and beyond.' },
    { office: 'VICE PRESIDENT', slotId: 'exec-vice-president', name: 'Officer Name', photo: 'images/executives/vice-president.jpg', duty: 'Supports the president and acts in their stead, coordinating committees and special projects.' },
    { office: 'GENERAL SECRETARY', slotId: 'exec-secretary', name: 'Officer Name', photo: 'images/executives/secretary.jpg', duty: 'Keeps records and minutes, handles correspondence, and communicates decisions to members.' },
    { office: 'TREASURER', slotId: 'exec-treasurer', name: 'Officer Name', photo: 'images/executives/treasurer.jpg', duty: 'Safeguards club funds, manages the accounts, and reports on the club’s financial position.' },
    { office: 'FINANCIAL SECRETARY', slotId: 'exec-financial-secretary', name: 'Officer Name', photo: 'images/executives/financial-secretary.jpg', duty: 'Collects dues and levies, issues receipts, and keeps accurate financial records.' },
    { office: 'PUBLIC RELATIONS OFFICER', slotId: 'exec-pro', name: 'Officer Name', photo: 'images/executives/pro.jpg', duty: 'Manages publicity and the club’s public image, and liaises with the press and partner bodies.' },
    { office: 'SOCIAL SECRETARY', slotId: 'exec-social-secretary', name: 'Officer Name', photo: 'images/executives/social-secretary.jpg', duty: 'Plans the owambes — galas, festivals, picnics — and everything that brings members together.' },
    { office: 'WELFARE OFFICER', slotId: 'exec-welfare-officer', name: 'Officer Name', photo: 'images/executives/welfare-officer.jpg', duty: 'Looks after members’ wellbeing, coordinating support through milestones and hardships.' },
    { office: 'PROVOST', slotId: 'exec-provost', name: 'Officer Name', photo: 'images/executives/provost.jpg', duty: 'Keeps order at meetings and events, and upholds the club’s code of conduct.' }
  ],
  gallery: [
    { slotId: 'gal-eyo-festival', title: 'Eyo Cultural Day', date: 'May 2026', tag: 'FESTIVAL', cat: 'Festivals', photo: 'images/events/eyo-festival.jpg' },
    { slotId: 'gal-annual-gala', title: 'Annual Gala Night', date: 'December 2025', tag: 'GALA', cat: 'Galas', photo: 'images/events/annual-gala.jpg' },
    { slotId: 'gal-independence', title: 'Independence Day Picnic', date: 'October 2025', tag: 'FESTIVAL', cat: 'Festivals', photo: 'images/events/independence.jpg' },
    { slotId: 'gal-outreach', title: 'Community Outreach', date: 'September 2025', tag: 'COMMUNITY', cat: 'Community', photo: 'images/events/outreach.jpg' },
    { slotId: 'gal-health-walk', title: 'Health Walk for Charity', date: 'August 2025', tag: 'COMMUNITY', cat: 'Community', photo: 'images/events/health-walk.jpg' },
    { slotId: 'gal-general-meeting', title: 'General Meeting', date: 'July 2025', tag: 'MEETING', cat: 'Meetings', photo: 'images/events/general-meeting.jpg' },
    { slotId: 'gal-christmas', title: 'Christmas Party', date: 'December 2024', tag: 'GALA', cat: 'Galas', photo: 'images/events/christmas.jpg' },
    { slotId: 'gal-cultural-day', title: 'Lagos Cultural Day', date: 'June 2025', tag: 'FESTIVAL', cat: 'Festivals', photo: 'images/events/cultural-day.jpg' },
    { slotId: 'gal-inauguration', title: 'Executive Inauguration', date: 'January 2026', tag: 'MEETING', cat: 'Meetings', photo: 'images/events/inauguration.jpg' }
  ],
  activities: [
    { day: '02', month: 'AUG', title: 'General Meeting', detail: 'First Sunday of the month · Indianapolis' },
    { day: '15', month: 'AUG', title: 'Eyo Cultural Day', detail: 'Family-friendly festival with music, food, and dance' },
    { day: '03', month: 'OCT', title: 'Independence Gala', detail: 'Nigeria @ 66 black-tie gala · tickets at the meeting' }
  ],
  // The year-long programme of activities and initiatives, shown on the
  // Calendar page and editable in the admin panel. `status` is either
  // 'Completed' or 'Upcoming'; `category' drives the colour tag.
  calendar: {
    year: 2026,
    programs: [
      { month: 'JAN', date: 'Sun, Jan 4', title: 'Executive Inauguration & New Year Meeting', category: 'Meeting', status: 'Completed', detail: 'Swearing-in of the new executive council and the first general meeting of the year.' },
      { month: 'FEB', date: 'Sat, Feb 14', title: 'Membership Drive & Welcome Social', category: 'Community', status: 'Completed', detail: 'Welcoming new members and reconnecting the Ékò family after the holidays.' },
      { month: 'MAR', date: 'Sat, Mar 21', title: 'Ìdílé Family & Culture Day', category: 'Festival', status: 'Completed', detail: 'A family day of Lagos food, language, and games for all generations.' },
      { month: 'APR', date: 'Sat, Apr 18', title: 'Charity Health Walk', category: 'Community', status: 'Completed', detail: 'A community walk raising funds for a chosen health cause in Indiana and Lagos.' },
      { month: 'MAY', date: 'Sat, May 23', title: 'Eyo Cultural Day', category: 'Festival', status: 'Completed', detail: 'Our flagship Eyo-inspired festival of music, masquerade, and heritage.' },
      { month: 'JUN', date: 'Sun, Jun 7', title: 'Mid-Year General Meeting & Financial Review', category: 'Meeting', status: 'Completed', detail: 'Progress review, financial report to members, and second-half planning.' },
      { month: 'JUL', date: 'Sat, Jul 25', title: 'Summer Picnic & Games', category: 'Community', status: 'Upcoming', detail: 'A family picnic with games, grilling, and music to mark the summer.' },
      { month: 'AUG', date: 'Sat, Aug 22', title: 'Back-to-School Support Drive', category: 'Welfare', status: 'Upcoming', detail: 'Collecting and distributing school supplies for members’ children and partner schools.' },
      { month: 'SEP', date: 'Sun, Sep 6', title: 'Independence Anniversary Planning Meeting', category: 'Meeting', status: 'Upcoming', detail: 'Finalising plans and committees for the Independence Gala.' },
      { month: 'OCT', date: 'Sat, Oct 3', title: 'Nigeria Independence Gala Night', category: 'Gala', status: 'Upcoming', detail: 'Black-tie celebration of Nigeria’s independence with dinner, awards, and dancing.' },
      { month: 'NOV', date: 'Sat, Nov 21', title: 'Community Thanksgiving & Outreach', category: 'Community', status: 'Upcoming', detail: 'Giving back through a food drive and outreach to families in need.' },
      { month: 'DEC', date: 'Sat, Dec 19', title: 'End-of-Year Awards & Christmas Party', category: 'Gala', status: 'Upcoming', detail: 'Celebrating the year, honouring members, and closing with our Christmas party.' }
    ]
  }
};
