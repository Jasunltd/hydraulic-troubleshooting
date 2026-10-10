workspace "Hydraulic Troubleshooting Signal Study" "Clean-room CI research context" {
  model {
    engineer = person "Engineer" "Owns interpretation and future validation decisions."
    publicData = softwareSystem "Public UCI Dataset" "Experimental hydraulic test-rig cycles and labels."
    analysis = softwareSystem "Deterministic Analysis" "Audits data and calculates transparent matched signal evidence."
    researchState = softwareSystem "Canonical Research State" "Stores typed evidence, claims, hypotheses, constraints, and records."
    caseStudy = softwareSystem "Recruiter Case Study" "Projection of the canonical research semantics."

    engineer -> publicData "Selects public source"
    publicData -> analysis "Supplies public raw evidence"
    analysis -> researchState "Supplies reproducible statistical evidence"
    researchState -> caseStudy "Projects evidence-backed narrative"
    engineer -> researchState "Owns proposal-only engineering decisions"
  }
  views {
    systemContext researchState "SystemContext" {
      include *
      autoLayout lr
    }
  }
}
