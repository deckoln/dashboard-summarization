project_name: "pj_dashboard_summarization_production"

application: dashboard_summarization {
  label: "Dashboard Summarization"
  url: "https://looker-dashboard-summarization-436666578289.asia-northeast1.run.app/dashboard_summarization.js"
  mount_points: {
    dashboard_vis: yes
    dashboard_tile: yes
    standalone: no
  }
  entitlements: {
    use_form_submit: yes
    navigation: yes
    use_embeds: yes
    use_iframes: yes
    new_window: yes
    local_storage: yes
    external_api_urls: ["https://looker-gen-api-backend-436666578289.asia-northeast1.run.app"]
    scoped_user_attributes:["genai_client_secret"]
  }
}
