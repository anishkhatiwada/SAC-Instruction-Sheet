import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    backgroundColor: "#FFFFFF",
  },
  
  // ===== HEADER STYLING =====
  headerLine: {
    height: 3,
    backgroundColor: "#4F46E5",
    marginBottom: 12,
    borderRadius: 2,
  },
  
  // Enhanced Title with Design
  title: {
    fontSize: 24,
    marginBottom: 6,
    marginTop: 2,
    fontWeight: 900,
    color: "#4F46E5",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    padding: 10,
    borderRadius: 4,
    textAlign: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#4F46E5",
    backgroundColor: "#F0F4FF",
  },
  
  subtitle: {
    fontSize: 10,
    color: "#4F46E5",
    marginBottom: 12,
    fontWeight: 600,
    fontStyle: "italic",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 10,
  },
  
  // ===== ROW STYLING =====
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F1F5F9",
    alignItems: "center",
    pageBreakInside: "avoid",
  },
  
  rowEven: {
    backgroundColor: "#F8FAFF",
    borderLeftWidth: 2,
    borderLeftColor: "#4F46E5",
  },
  
  // ===== KEY/LABEL STYLING =====
  key: {
    width: 110,
    fontWeight: 700,
    color: "#FFFFFF",
    backgroundColor: "#4F46E5",
    padding: 6,
    borderRadius: 3,
    textTransform: "capitalize",
    fontSize: 9,
    letterSpacing: 0.2,
    marginRight: 8,
  },
  
  // ===== VALUE STYLING =====
  val: {
    flex: 1,
    color: "#334155",
    lineHeight: 1.4,
    fontWeight: 400,
    fontSize: 10,
  },
  
  // ===== FOOTER STYLING =====
  footer: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    fontSize: 7,
    color: "#94A3B8",
    textAlign: "center",
    paddingBottom: 4,
  },
});
