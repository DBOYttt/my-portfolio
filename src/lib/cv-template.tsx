import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { renderToBuffer } from "@react-pdf/renderer";

export interface CvContent {
  summary: string;
  skills: { category: string; items: string[] }[];
  experience: {
    company: string;
    role: string;
    period: string;
    description: string;
    type: string;
  }[];
  projects: { title: string; summary: string; tech: string[] }[];
  contact: { email: string; github?: string; website?: string; yearsOfExperience?: number };
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#111111",
    backgroundColor: "#ffffff",
    paddingTop: 40,
    paddingBottom: 40,
    paddingLeft: 40,
    paddingRight: 40,
  },
  // Header
  header: {
    backgroundColor: "#1a1d27",
    marginTop: -40,
    marginLeft: -40,
    marginRight: -40,
    paddingTop: 30,
    paddingBottom: 24,
    paddingLeft: 40,
    paddingRight: 40,
    marginBottom: 0,
  },
  headerName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    color: "#f1f5f9",
    marginBottom: 4,
  },
  headerEmail: {
    fontSize: 10,
    color: "#94a3b8",
    fontFamily: "Helvetica",
    marginBottom: 2,
  },
  headerLinks: {
    fontSize: 9,
    color: "#64748b",
    fontFamily: "Helvetica",
  },
  accentLine: {
    height: 2,
    backgroundColor: "#06b6d4",
    marginBottom: 20,
    marginTop: 0,
  },
  // Sections
  section: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#06b6d4",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    borderLeftColor: "#06b6d4",
    borderLeftWidth: 2,
    paddingLeft: 8,
    marginBottom: 8,
  },
  // Summary
  summaryText: {
    fontSize: 9.5,
    color: "#333333",
    lineHeight: 1.4,
  },
  // Skills
  skillRow: {
    flexDirection: "row",
    marginBottom: 4,
    flexWrap: "wrap",
  },
  skillCategory: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#555555",
    width: 90,
    flexShrink: 0,
  },
  skillItems: {
    fontSize: 9,
    color: "#333333",
    flex: 1,
    lineHeight: 1.5,
  },
  // Experience
  expEntry: {
    marginBottom: 10,
  },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  expCompany: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: "#111111",
  },
  expPeriod: {
    fontSize: 9,
    color: "#777777",
    fontFamily: "Helvetica",
  },
  expRole: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 9,
    color: "#555555",
    marginBottom: 3,
  },
  expDesc: {
    fontSize: 9,
    color: "#444444",
    lineHeight: 1.5,
  },
  // Projects
  projectEntry: {
    marginBottom: 10,
  },
  projectHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    flexWrap: "wrap",
    gap: 6,
  },
  projectTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: "#111111",
  },
  projectTech: {
    fontSize: 8,
    color: "#06b6d4",
    marginLeft: 8,
  },
  projectSummary: {
    fontSize: 9,
    color: "#444444",
    lineHeight: 1.5,
  },
  // Contact
  contactRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  contactItem: {
    fontSize: 9,
    color: "#555555",
  },
  contactLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: "#444444",
  },
  divider: {
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 0.5,
    marginBottom: 12,
  },
});

function CvDocument({ cvContent }: { cvContent: CvContent }) {
  const displayName =
    cvContent.contact.email
      ? cvContent.contact.email.split("@")[0] ?? "Portfolio CV"
      : "Portfolio CV";

  const formattedName = displayName
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerName}>{formattedName}</Text>
          <Text style={styles.headerEmail}>{cvContent.contact.email}</Text>
          {(cvContent.contact.github || cvContent.contact.website) && (
            <Text style={styles.headerLinks}>
              {[cvContent.contact.github, cvContent.contact.website]
                .filter(Boolean)
                .join("  •  ")}
            </Text>
          )}
          {cvContent.contact.yearsOfExperience != null && (
            <Text style={{ fontSize: 9, color: "#64748b", fontFamily: "Helvetica", marginTop: 2 }}>
              {cvContent.contact.yearsOfExperience}+ years of experience
            </Text>
          )}
        </View>
        <View style={styles.accentLine} />

        {/* Summary */}
        {cvContent.summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Profile</Text>
            <Text style={styles.summaryText}>{cvContent.summary}</Text>
          </View>
        ) : null}

        <View style={styles.divider} />

        {/* Skills */}
        {cvContent.skills.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Skills</Text>
            {cvContent.skills.map((group, i) => (
              <View key={i} style={styles.skillRow}>
                <Text style={styles.skillCategory}>{group.category}</Text>
                <Text style={styles.skillItems}>{group.items.join(", ")}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.divider} />

        {/* Experience */}
        {cvContent.experience.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Experience</Text>
            {cvContent.experience.map((exp, i) => (
              <View key={i} style={styles.expEntry}>
                <View style={styles.expHeader}>
                  <Text style={styles.expCompany}>{exp.company}</Text>
                  <Text style={styles.expPeriod}>{exp.period}</Text>
                </View>
                <Text style={styles.expRole}>
                  {exp.role}
                  {exp.type ? `  ·  ${exp.type}` : ""}
                </Text>
                <Text style={styles.expDesc}>{exp.description}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.divider} />

        {/* Projects */}
        {cvContent.projects.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Featured Projects</Text>
            {cvContent.projects.map((proj, i) => (
              <View key={i} style={styles.projectEntry}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectTitle}>{proj.title}</Text>
                  {proj.tech.length > 0 && (
                    <Text style={styles.projectTech}>
                      {proj.tech.join(" · ")}
                    </Text>
                  )}
                </View>
                <Text style={styles.projectSummary}>{proj.summary}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.divider} />

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Contact</Text>
          <View style={styles.contactRow}>
            <Text style={styles.contactItem}>
              <Text style={styles.contactLabel}>Email: </Text>
              {cvContent.contact.email}
            </Text>
            {cvContent.contact.github ? (
              <Text style={styles.contactItem}>
                <Text style={styles.contactLabel}>GitHub: </Text>
                {cvContent.contact.github}
              </Text>
            ) : null}
            {cvContent.contact.website ? (
              <Text style={styles.contactItem}>
                <Text style={styles.contactLabel}>Website: </Text>
                {cvContent.contact.website}
              </Text>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderCvToPdf(cvContent: CvContent): Promise<Buffer> {
  const buffer = await renderToBuffer(<CvDocument cvContent={cvContent} />);
  return Buffer.from(buffer);
}
