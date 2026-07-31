'use client'

// import { EmailTemplateForm } from '../send'
// import { EmailTemplateViewer } from '../send/components/email-settings-view-page'

interface ContentProps {
  tabId: string
}

export const Content = ({ tabId }: ContentProps) => {
  return <div>Templates</div>

  // If tabId is not 'new', treat it as an ID for viewing/editing
  // The EmailSettingsViewPage component will handle invalid IDs gracefully
}
