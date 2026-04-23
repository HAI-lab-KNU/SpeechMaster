# SpeechMaster:
SpeechMaster is a proactive, conversational microlearning services for smart speakers. It is designed to improve English pronunciation through speech shadowing techniques. SpeechMaster was implemented in a commercial smart speaker (Google Nest Mini) and developed a speaker add-on device and related applications (triggering app, sensing app, and image deleter app) that enable the speaker to operate proactively. The process of SpeechMaster consists of four steps: (1) activity inquiry, (2) availability inquiry, (3) speech shadowing, and (4) continue-to-next inquiry. 

# Repository structure
- **sdk/**  <!-- Google Actions SDK project files -->
- **manifest.yaml**  <!-- Project metadata and version info -->
- **actions/**  <!-- Action entry points and invocation config -->
- **custom/**  <!-- Custom intents, scenes, and prompts -->
- **settings/**  <!-- Project settings (projectId, locale, etc.) -->
- **webhooks/**  <!-- Fulfillment webhook handler definitions -->

## Important notice: 
Google Conversational Actions was officially discontinued on June 13, 2023. This repository is preserved for archival and research reference purposes. The action can no longer be deployed or activated through Google Assistant.

# How to backup Google Actions project
* Install @assistant/gactions: https://github.com/actions-on-google/gactions
* Log in to your Google account: type ‘gactions login’ in your terminal
* Initialize ‘settings.yaml’ file
  *  Create a folder(e.g., ‘smartspeaker’) inside working directory (e.g., ‘mkdir -p smartspeaker/settings’)
  * Create a ‘settings.yaml’ file inside ‘settings’ folder (‘/smartspeaker/settings/settings.yaml’)
  * Put ‘projectId’ information inside the ‘settings.yaml’ file (‘projectId: proactivespeaker-def0a’)
* Command to pull your actions project to the local
  * In your terminal, navigate to “smartspeaker” folder (e.g., ‘cd smartspeaker’)
  * Type “gactions pull”. your actions project will be updated inside ‘smartspeaker’ folder


