# SpeechMaster:
SpeechMaster is a proactive, conversational microlearning services for smart speakers. It is designed to improve English pronunciation through speech shadowing techniques. SpeechMaster was implemented in a commercial smart speaker (Google Nest Mini) and developed a speaker add-on device and related applications (triggering app, sensing app, and image deleter app) that enable the speaker to operate proactively. The process of SpeechMaster consists of four steps: (1) activity inquiry, (2) availability inquiry, (3) speech shadowing, and (4) continue-to-next inquiry. 

# Repository structure
**sdk/**  \# Google Actions SDK project files 

   **manifest.yaml**  \# Project metadata and version info
- **actions/**  \# Action entry points and invocation config
- **custom/**  \# Custom intents, scenes, and prompts
- **settings/**  \# Project settings (projectId, locale, etc.)
- **webhooks/**  \# Fulfillment webhook handler definitions

# Prerequisites
* Node.js v10.13 or later
* Google account with access to Actions on Google console
* Google Actions CLI (gactions)

# Installation
https://developers.google.com/assistant/conversational/overview

## Important notice: 
Google Conversational Actions was officially discontinued on June 13, 2023. This repository is preserved for archival and research reference purposes. The action can no longer be deployed or activated through Google Assistant.

