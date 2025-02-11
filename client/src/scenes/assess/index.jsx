import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  Typography,
  useTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Checkbox,
  FormControlLabel,
  Alert,
} from "@mui/material";
import { tokens } from "../../theme";
import { DataGrid } from "@mui/x-data-grid";
import Header from "../../components/Header";
import { mockDataSE } from "../../sampledata/mockData";

// Define evaluation criteria for each category
const evaluationCriteria = {
  teamwork: {
    1: [
      "Lack of collaboration among team members.",
      "Frequent miscommunication leading to inefficiencies.",
      "Minimal participation in group discussions.",
      "Team members do not support or assist each other effectively.",
      "Poor delegation of tasks, leading to confusion and delays.",
      "No clear teamwork structure or coordination.",
    ],
    2: [
      "Occasional coordination issues causing inefficiencies.",
      "Task delegation is inconsistent, leading to workload imbalances.",
      "Collaboration efforts exist but lack effectiveness.",
      "Communication is unclear, causing misunderstandings.",
      "Team members work individually rather than as a unit.",
      "Conflicts arise but are not effectively addressed.",
    ],
    3: [
      "Teamwork is functional but lacks refinement.",
      "Collaboration happens but is not always proactive.",
      "Communication is improving but still has gaps.",
      "Team members assist each other but not consistently.",
      "Conflicts are resolved, but not always smoothly.",
      "Task management is structured but could be more efficient.",
    ],
    4: [
      "Team demonstrates strong collaboration and shared goals.",
      "Communication is clear, with only minor misunderstandings.",
      "Members actively support and motivate each other.",
      "Task delegation is effective, with only small improvements needed.",
      "Conflicts are handled well, with a positive resolution process.",
      "The team works efficiently, with occasional areas for refinement.",
    ],
    5: [
      "Exceptional teamwork and seamless collaboration.",
      "Crystal-clear communication, fostering productivity.",
      "Leadership and unity create a highly efficient team.",
      "Team members proactively support and uplift one another.",
      "Problem-solving is highly effective, even under pressure.",
      "Consistently surpasses teamwork expectations and goals.",
    ],
  },
  financialPlanning: {
    1: [
      "No financial planning or budgeting in place.",
      "Frequent overspending without accountability.",
      "No tracking of income or expenses.",
      "Lack of financial transparency and reporting.",
      "No cost-cutting measures or savings plan.",
      "High financial risks with no mitigation strategies.",
    ],
    2: [
      "Basic financial planning exists but lacks detail.",
      "Budgeting is inconsistent and unstructured.",
      "Limited financial tracking and reporting.",
      "Spending is monitored but lacks strict control.",
      "Minimal efforts to manage financial risks.",
      "Unclear revenue generation strategies.",
    ],
    3: [
      "Financial planning is improving but still has gaps.",
      "Some accountability in spending but needs refinement.",
      "Budgeting exists but is not always followed.",
      "Basic financial reports are available but not detailed.",
      "Risk management strategies are developing but not robust.",
      "Revenue and expenses are tracked but inconsistently.",
    ],
    4: [
      "Strong financial planning with minor improvements needed.",
      "Clear accountability in spending and budgeting.",
      "Financial reports provide good insights but could be more detailed.",
      "Effective cost-cutting and savings strategies in place.",
      "Well-defined financial goals but require periodic adjustments.",
      "Revenue and risk management strategies are mostly effective.",
    ],
    5: [
      "Exceptional financial strategy ensuring sustainable growth.",
      "Clear budgeting and resource allocation maximizing efficiency.",
      "Proactive risk management and strong financial foresight.",
      "Effective revenue generation and cost-control measures in place.",
      "Well-structured financial reports guiding informed decision-making.",
      "Outstanding transparency and accountability in financial management.",
    ],
  },
  marketingPlan: {
    1: [
      "No marketing plan or strategy in place.",
      "Minimal effort in promoting the product/service.",
      "No brand identity or customer engagement activities.",
      "Lack of understanding of the target market.",
      "No use of digital or traditional marketing methods.",
      "Ineffective communication of the product/service benefits.",
    ],
    2: [
      "Basic marketing efforts exist but lack structure.",
      "Promotion is inconsistent and fails to attract attention.",
      "Limited awareness of the brand within the target audience.",
      "Market research is minimal and lacks actionable insights.",
      "Digital and traditional marketing channels are underutilized.",
      "Customer engagement strategies are unclear or ineffective.",
    ],
    3: [
      "Marketing plan is structured but needs refinement.",
      "Promotion strategies are in place but lack full execution.",
      "Brand recognition is improving but remains inconsistent.",
      "Basic market research is conducted but lacks depth.",
      "Customer engagement strategies exist but need more consistency.",
      "Marketing budget allocation is present but not fully optimized.",
    ],
    4: [
      "Well-developed marketing plan with clear execution strategies.",
      "Promotion efforts effectively reach and attract the target audience.",
      "Brand identity is strong with consistent messaging.",
      "Comprehensive market research drives informed decisions.",
      "Customer engagement strategies are personalized and interactive.",
      "Multi-channel marketing efforts are well-coordinated and effective.",
    ],
    5: [
      "Exceptional marketing plan with strategic execution.",
      "Highly effective promotional campaigns maximizing audience reach.",
      "Strong and recognizable brand identity with high market influence.",
      "Data-driven marketing strategies ensuring sustainable growth.",
      "Customer engagement is dynamic, fostering brand loyalty.",
      "Innovative and adaptive marketing techniques consistently outperform competitors.",
    ],
  },
  productServiceDesign: {
    1: [
      "No clear product/service design or development strategy.",
      "Lack of innovation or differentiation in offerings.",
      "Customer needs and preferences are not considered.",
      "Poor usability and functionality of the product/service.",
      "No structured planning for product/service improvements.",
      "Lack of testing or validation before launch.",
    ],
    2: [
      "Basic product/service concept exists but lacks refinement.",
      "Minimal efforts in identifying unique selling points.",
      "Customer feedback is collected but not effectively used.",
      "Usability and functionality remain underdeveloped.",
      "Planning process is inconsistent and lacks foresight.",
      "Market feasibility and demand analysis are insufficient.",
    ],
    3: [
      "Product/service design has a working foundation but needs enhancements.",
      "Moderate efforts in differentiation but still room for improvement.",
      "Customer feedback is acknowledged and selectively applied.",
      "Usability and functionality are improving but not yet optimized.",
      "Planning process is becoming structured but lacks adaptability.",
      "Market research exists but needs deeper insights to guide decisions.",
    ],
    4: [
      "Well-developed product/service design with strategic refinement in place.",
      "Competitive differentiation is evident and evolving.",
      "Customer feedback drives regular iterative improvements.",
      "Usability and functionality are strong with minor optimization needed.",
      "Planning includes both short-term execution and long-term vision.",
      "Market research informs innovation and adapts to trends effectively.",
    ],
    5: [
      "Exceptional product/service design demonstrating strategic innovation.",
      "Strong brand identity and differentiation securing market position.",
      "Customer insights are seamlessly integrated into design decisions.",
      "Top-tier usability and functionality exceeding user expectations.",
      "Future-proofed planning that ensures continuous adaptation and growth.",
      "Data-driven approach fostering sustained competitive advantage.",
    ],
  },
  humanResourceManagement: {
    1: [
      "No HR management or team structure in place.",
      "Frequent unresolved conflicts disrupting team cohesion.",
      "No clear roles or responsibilities among team members.",
      "Lack of leadership and accountability.",
      "No professional development or training opportunities.",
      "Poor communication and lack of teamwork.",
    ],
    2: [
      "Basic HR management exists but is inconsistent.",
      "Conflicts arise frequently with delayed resolutions.",
      "Roles and responsibilities are unclear at times.",
      "Minimal leadership guidance affecting team performance.",
      "Limited professional development opportunities.",
      "Communication barriers create misunderstandings.",
    ],
    3: [
      "HR management is functional but requires improvement.",
      "Conflict resolution is present but not always effective.",
      "Defined roles exist but require better clarity and execution.",
      "Leadership provides direction but lacks consistency.",
      "Some training and development efforts are in place.",
      "Communication is improving but needs better alignment.",
    ],
    4: [
      "Well-structured HR management with minor gaps.",
      "Conflicts are handled effectively with fair resolutions.",
      "Roles and responsibilities are clearly defined and executed.",
      "Leadership fosters a collaborative and motivated environment.",
      "Regular professional development initiatives in place.",
      "Strong communication and teamwork culture.",
    ],
    5: [
      "Exceptional HR management with outstanding leadership.",
      "Conflicts are rare and proactively managed.",
      "Roles, responsibilities, and accountability are well-balanced.",
      "Leadership inspires high performance and teamwork.",
      "Comprehensive training and development programs.",
      "Highly effective communication ensuring seamless collaboration.",
    ],
  },
  logistics: {
    1: [
      "No logistics planning or execution.",
      "Frequent delays and inefficiencies in operations.",
      "Lack of inventory or supply chain management.",
      "Transportation and delivery processes are disorganized.",
      "No tracking or monitoring of shipments.",
      "Significant disruptions affecting overall efficiency.",
    ],
    2: [
      "Basic logistics planning exists but lacks structure.",
      "Delays occur due to poor coordination.",
      "Supply chain is unreliable and inconsistent.",
      "Inventory management is weak, causing shortages or excess stock.",
      "Transportation strategies are ineffective.",
      "Limited tracking and monitoring of goods movement.",
    ],
    3: [
      "Logistics planning is improving but still needs refinement.",
      "Execution is inconsistent but shows progress.",
      "Supply chain management is in place but needs optimization.",
      "Inventory control has improved but requires more efficiency.",
      "Transportation is better coordinated but not fully optimized.",
      "Tracking and monitoring exist but need better accuracy.",
    ],
    4: [
      "Strong logistics planning ensuring smoother operations.",
      "Timely and efficient coordination of deliveries.",
      "Reliable supply chain with minor areas for improvement.",
      "Inventory management is well-handled, reducing stock issues.",
      "Transportation processes are well-structured and cost-effective.",
      "Advanced tracking systems in place, with occasional lapses.",
    ],
    5: [
      "Exceptional logistics planning and flawless execution.",
      "Highly efficient and punctual delivery processes.",
      "Optimized supply chain ensuring seamless operations.",
      "Advanced inventory management preventing shortages or surpluses.",
      "Cost-effective and sustainable transportation strategies.",
      "Real-time tracking and data-driven decision-making for logistics.",
    ],
  },
};

const AssessSEPage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [openSelectDialog, setOpenSelectDialog] = useState(false); // For SE selection dialog
  const [openEvaluateDialog, setOpenEvaluateDialog] = useState(false); // For evaluation dialog
  const [selectedSEs, setSelectedSEs] = useState([]); // Selected SEs for evaluation
  const [currentSEIndex, setCurrentSEIndex] = useState(0); // Index of the current SE being evaluated
  const [evaluations, setEvaluations] = useState({}); // Store evaluations for all SEs
  const [error, setError] = useState("");
  
  // Handle SE selection checkbox change
  const handleSESelectionChange = (seId) => {
    setSelectedSEs((prev) =>
      prev.includes(seId) ? prev.filter((id) => id !== seId) : [...prev, seId]
    );
  };

  // Open the SE selection dialog
  const handleOpenSelectDialog = () => {
    setOpenSelectDialog(true);
  };

  // Close the SE selection dialog
  const handleCloseSelectDialog = () => {
    setOpenSelectDialog(false);
  };

  // Start evaluation after SE selection
  const handleStartEvaluation = () => {
    if (selectedSEs.length === 0) {
      setError("Please select at least one Social Enterprise to evaluate.");
      return;
    }
    setError("");
    setCurrentSEIndex(0);
    setOpenSelectDialog(false);
    setOpenEvaluateDialog(true);
  };

  // Handle rating change for the current SE
  const handleRatingChange = (category, value) => {
    const currentSEId = selectedSEs[currentSEIndex];
    setEvaluations((prev) => ({
      ...prev,
      [currentSEId]: {
        ...prev[currentSEId],
        [category]: {
          ...prev[currentSEId]?.[category],
          rating: prev[currentSEId]?.[category]?.rating === value ? 0 : value,
          selectedCriteria: [],
        },
      },
    }));
    setError("");
  };

  // Handle predefined criteria selection for the current SE
  const handleCriteriaChange = (category, criterion) => {
    const currentSEId = selectedSEs[currentSEIndex];
    setEvaluations((prev) => ({
      ...prev,
      [currentSEId]: {
        ...prev[currentSEId],
        [category]: {
          ...prev[currentSEId]?.[category],
          selectedCriteria: prev[currentSEId]?.[
            category
          ]?.selectedCriteria.includes(criterion)
            ? prev[currentSEId][category].selectedCriteria.filter(
                (c) => c !== criterion
              )
            : [...prev[currentSEId][category].selectedCriteria, criterion],
        },
      },
    }));
    setError("");
  };

  // Handle additional comments change for the current SE
  const handleCommentsChange = (category, value) => {
    const currentSEId = selectedSEs[currentSEIndex];
    setEvaluations((prev) => ({
      ...prev,
      [currentSEId]: {
        ...prev[currentSEId],
        [category]: {
          ...prev[currentSEId]?.[category],
          comments: value,
        },
      },
    }));
  };

  const handleSubmit = async () => {
    const currentSEId = selectedSEs[currentSEIndex];
    const currentEvaluations = evaluations[currentSEId];
  
    // Retrieve user session data
    const userSession = JSON.parse(localStorage.getItem("user"));
    if (!userSession || !userSession.id) {
      console.error("❌ User session not found.");
      return;
    }
  
    // Validate that at least two predefined comments are selected for each category
    const isValid = Object.values(currentEvaluations || {}).every(
      (categoryEval) => categoryEval.selectedCriteria?.length >= 2
    );
  
    if (!isValid) {
      setError("Please select at least two predefined comments for each category.");
      return;
    }
  
    // Store the completed evaluation before moving to the next SE
    setEvaluations((prev) => ({
      ...prev,
      [currentSEId]: currentEvaluations,
    }));
  
    // Check if there are more SEs to evaluate
    if (currentSEIndex < selectedSEs.length - 1) {
      setCurrentSEIndex(currentSEIndex + 1);
    } else {
      // After evaluating the last SE, send all evaluations to the backend
      try {
        const formData = {
          evaluatorId: userSession.id,
          evaluations,
        };
  
        console.log("📤 Sending ALL evaluations to server:", formData);
  
        const response = await axios.post("http://localhost:4000/evaluate", formData);
        console.log("✅ Evaluations successfully sent to backend:", response.data);
  
        handleCloseEvaluateDialog(); // Close the dialog after final submission
      } catch (error) {
        console.error("❌ Error submitting evaluations:", error);
      }
    }
  };

  // Close the evaluation dialog
  const handleCloseEvaluateDialog = () => {
    setOpenEvaluateDialog(false);
    setSelectedSEs([]);
    setCurrentSEIndex(0);
    setEvaluations({});
  };

  const columns = [
    { field: "id", headerName: "ID", flex: 0.5 },
    { field: "name", headerName: "Social Enterprise", flex: 1 },
    { field: "mentor", headerName: "Mentor", flex: 1 },
    { field: "sdg", headerName: "SDG", flex: 1 },
    { field: "contact", headerName: "Contact", flex: 1 },
    { field: "members", headerName: "Members", flex: 0.5 },
    { field: "program", headerName: "Program", flex: 1 },
    { field: "status", headerName: "Status", flex: 0.5 },
  ];

  return (
    <Box m="20px">
      <Header title="ASSESS SE" subtitle="Evaluate and manage SE performance" />
      <Box display="flex" flexDirection="column" alignItems="center" gap={4}>
        {/* Buttons */}
        <Box
          width="80%"
          p={3}
          bgcolor={colors.primary[400]}
          display="flex"
          justifyContent="space-between"
        >
          <Button
            variant="contained"
            color="secondary"
            sx={{ fontSize: "20px", padding: "20px", width: "48%" }}
            onClick={handleOpenSelectDialog}
          >
            Evaluate SE
          </Button>
          <Button
            variant="contained"
            color="secondary"
            sx={{ fontSize: "20px", padding: "20px", width: "48%" }}
          >
            File LOM
          </Button>
        </Box>

        {/* DataGrid */}
        <Box
          width="80%"
          height="250px"
          sx={{
            "& .MuiDataGrid-root": { border: "none" },
            "& .MuiDataGrid-cell": { borderBottom: "none" },
            "& .name-column--cell": { color: colors.greenAccent[300] },
            "& .MuiDataGrid-columnHeaders": {
              backgroundColor: colors.blueAccent[700],
              borderBottom: "none",
            },
            "& .MuiDataGrid-virtualScroller": {
              backgroundColor: colors.primary[400],
            },
            "& .MuiDataGrid-footerContainer": {
              borderTop: "none",
              backgroundColor: colors.blueAccent[700],
            },
          }}
        >
          <DataGrid rows={mockDataSE} columns={columns} />
        </Box>

        {/* SE Selection Dialog */}
        <Dialog
          open={openSelectDialog}
          onClose={handleCloseSelectDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Select Social Enterprises for Evaluation</DialogTitle>
          <DialogContent>
            {mockDataSE.map((se) => (
              <FormControlLabel
                key={se.id}
                control={
                  <Checkbox
                    checked={selectedSEs.includes(se.id)}
                    onChange={() => handleSESelectionChange(se.id)}
                  />
                }
                label={`${se.name} (${se.sdg})`}
              />
            ))}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseSelectDialog} color="primary">
              Cancel
            </Button>
            <Button onClick={handleStartEvaluation} color="primary">
              Start Evaluation
            </Button>
          </DialogActions>
        </Dialog>

        {/* Evaluation Dialog */}
        <Dialog
          open={openEvaluateDialog}
          onClose={handleCloseEvaluateDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Evaluate Social Enterprise</DialogTitle>
          <DialogContent>
            <Typography variant="h6">
              {
                mockDataSE.find((se) => se.id === selectedSEs[currentSEIndex])
                  ?.name
              }
            </Typography>
            {Object.keys(evaluationCriteria).map((category) => {
              const currentSEId = selectedSEs[currentSEIndex];
              const categoryEval = evaluations[currentSEId]?.[category] || {
                rating: 0,
                selectedCriteria: [],
                comments: "",
              };
              return (
                <Box key={category} mb={3}>
                  <Typography variant="subtitle1">
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Typography>
                  <Box display="flex" gap={1} justifyContent="center" mt={1}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Box
                        key={value}
                        width="40px"
                        height="40px"
                        border="1px solid black"
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        borderRadius="5px"
                        bgcolor={
                          value <= categoryEval.rating ? "gold" : "transparent"
                        }
                        sx={{ cursor: "pointer" }}
                        onClick={() => handleRatingChange(category, value)}
                      >
                        <Typography fontSize="24px">★</Typography>
                      </Box>
                    ))}
                  </Box>
                  {categoryEval.rating > 0 && (
                  <Box
                    sx={{
                      maxHeight: "150px",
                      overflowY: "auto",
                      mt: 2,
                      p: 1,
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      display: "flex",
                      flexDirection: "column", // Ensures vertical alignment
                      gap: 1, // Adds spacing between items
                    }}
                  >
                    {evaluationCriteria[category][categoryEval.rating]?.map(
                      (criterion, index) => (
                        <FormControlLabel
                          key={index}
                          control={
                            <Checkbox
                              checked={categoryEval.selectedCriteria.includes(criterion)}
                              onChange={() => handleCriteriaChange(category, criterion)}
                            />
                          }
                          label={criterion}
                        />
                      )
                    )}
                  </Box>
                  )}
                  <TextField
                    label={`Additional Comments for ${category}`}
                    multiline
                    rows={3}
                    value={categoryEval.comments}
                    onChange={(e) =>
                      handleCommentsChange(category, e.target.value)
                    }
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2 }}
                  />
                </Box>
              );
            })}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEvaluateDialog} color="primary">
              Cancel
            </Button>
            <Button onClick={handleSubmit} color="primary">
              Submit
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AssessSEPage;
