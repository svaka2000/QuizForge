import os
import logging
from typing import List, Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether
)
from reportlab.platypus.flowables import HRFlowable

logger = logging.getLogger(__name__)

PDF_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "pdfs")
os.makedirs(PDF_DIR, exist_ok=True)

# Palette
COLOR_PRIMARY = colors.HexColor("#1e40af")   # Blue
COLOR_ACCENT = colors.HexColor("#3b82f6")
COLOR_LIGHT = colors.HexColor("#eff6ff")
COLOR_DARK = colors.HexColor("#1e293b")
COLOR_GRAY = colors.HexColor("#64748b")
COLOR_LINE = colors.HexColor("#cbd5e1")


def _get_styles():
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="Title2",
        fontSize=20,
        fontName="Helvetica-Bold",
        textColor=COLOR_PRIMARY,
        alignment=TA_CENTER,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="Subtitle",
        fontSize=11,
        fontName="Helvetica",
        textColor=COLOR_GRAY,
        alignment=TA_CENTER,
        spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        name="SectionHeader",
        fontSize=11,
        fontName="Helvetica-Bold",
        textColor=colors.white,
        alignment=TA_LEFT,
        leftIndent=6,
    ))
    styles.add(ParagraphStyle(
        name="QuestionText",
        fontSize=11,
        fontName="Helvetica-Bold",
        textColor=COLOR_DARK,
        spaceAfter=4,
        leading=14,
    ))
    styles.add(ParagraphStyle(
        name="OptionText",
        fontSize=10,
        fontName="Helvetica",
        textColor=COLOR_DARK,
        leftIndent=20,
        spaceAfter=2,
        leading=13,
    ))
    styles.add(ParagraphStyle(
        name="Body2",
        fontSize=10,
        fontName="Helvetica",
        textColor=COLOR_DARK,
        leading=14,
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="AnswerKey",
        fontSize=10,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#15803d"),
        leftIndent=10,
    ))
    styles.add(ParagraphStyle(
        name="AnswerExplanation",
        fontSize=9,
        fontName="Helvetica-Oblique",
        textColor=COLOR_GRAY,
        leftIndent=20,
        spaceAfter=6,
    ))
    return styles


def _header_table(title: str, subtitle: str, version_label: str) -> Table:
    data = [[
        Paragraph(title, _get_styles()["Title2"]),
        Paragraph(version_label, ParagraphStyle(
            name="VLabel",
            fontSize=24,
            fontName="Helvetica-Bold",
            textColor=COLOR_PRIMARY,
            alignment=TA_CENTER,
        ))
    ]]
    t = Table(data, colWidths=[5 * inch, 1.5 * inch])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
    ]))
    return t


def _student_info_table() -> Table:
    styles = _get_styles()
    label_style = ParagraphStyle("LabelS", fontSize=9, fontName="Helvetica-Bold", textColor=COLOR_GRAY)
    data = [[
        Paragraph("Name: ___________________________________", label_style),
        Paragraph("Date: ________________", label_style),
        Paragraph("Period: __________", label_style),
    ]]
    t = Table(data, colWidths=[3 * inch, 2 * inch, 1.5 * inch])
    t.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, COLOR_LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, COLOR_LINE),
        ("BACKGROUND", (0, 0), (-1, -1), COLOR_LIGHT),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def _score_box() -> Table:
    label_style = ParagraphStyle("ScoreLabel", fontSize=9, fontName="Helvetica-Bold", textColor=COLOR_GRAY, alignment=TA_CENTER)
    data = [[Paragraph("Score", label_style)], [Paragraph("______ / ______", label_style)]]
    t = Table(data, colWidths=[1 * inch])
    t.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1, COLOR_PRIMARY),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def _section_banner(text: str) -> Table:
    data = [[Paragraph(text, _get_styles()["SectionHeader"])]]
    t = Table(data, colWidths=[6.5 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), COLOR_PRIMARY),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def _render_question(q: dict, idx: int, styles) -> List:
    elements = []
    q_type = q.get("type", "")
    points = q.get("points", 10)
    question_text = q.get("question", "")
    has_diagram = q.get("has_diagram", False)

    # Question number + points
    q_header = Paragraph(
        f"<b>{idx}.</b>  {question_text}  <font color='#64748b' size='9'>({points} pts)</font>",
        styles["QuestionText"]
    )
    elements.append(q_header)

    if has_diagram:
        # Placeholder box for diagram
        diag_data = [[Paragraph(
            "<i>[Diagram / Figure — Refer to attached materials]</i>",
            ParagraphStyle("DiagLabel", fontSize=9, textColor=COLOR_GRAY, alignment=TA_CENTER)
        )]]
        diag_t = Table(diag_data, colWidths=[5 * inch], rowHeights=[1.2 * inch])
        diag_t.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 1, COLOR_LINE),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]))
        elements.append(Spacer(1, 4))
        elements.append(diag_t)
        elements.append(Spacer(1, 4))

    if q_type == "multiple_choice" and q.get("options"):
        for opt in q["options"]:
            elements.append(Paragraph(f"&nbsp;&nbsp;&nbsp;{opt}", styles["OptionText"]))
        elements.append(Spacer(1, 6))

    elif q_type in ("short_answer", "word_problem"):
        # Answer lines
        for _ in range(3):
            elements.append(HRFlowable(width="100%", thickness=0.5, color=COLOR_LINE, spaceAfter=10))

    elements.append(Spacer(1, 8))
    return elements


def generate_worksheet_pdf(
    generation_id: int,
    version: str,
    questions: List[dict],
    title: str,
    subject: str,
    grade_level: str,
    topic: str,
) -> str:
    filename = f"gen_{generation_id}_version_{version.lower()}.pdf"
    filepath = os.path.join(PDF_DIR, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = _get_styles()
    story = []

    # Header
    story.append(_header_table(title, f"{subject} | Grade {grade_level}", f"Version {version}"))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"Topic: {topic}", styles["Subtitle"]))
    story.append(Spacer(1, 8))

    # Student info row
    info_score = Table(
        [[_student_info_table(), Spacer(0.2 * inch, 1), _score_box()]],
        colWidths=[4.8 * inch, 0.2 * inch, 1.5 * inch]
    )
    story.append(info_score)
    story.append(Spacer(1, 14))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_PRIMARY))
    story.append(Spacer(1, 10))

    # Instructions
    instructions = (
        "Directions: Answer all questions completely. For multiple choice, circle the best answer. "
        "For short answer and word problems, show your work and write in complete sentences where asked."
    )
    story.append(Paragraph(instructions, styles["Body2"]))
    story.append(Spacer(1, 10))

    # Group questions by type
    mc_questions = [q for q in questions if q.get("type") == "multiple_choice"]
    sa_questions = [q for q in questions if q.get("type") == "short_answer"]
    wp_questions = [q for q in questions if q.get("type") == "word_problem"]

    idx = 1
    if mc_questions:
        story.append(_section_banner(f"Section 1 — Multiple Choice"))
        story.append(Spacer(1, 8))
        for q in mc_questions:
            elems = _render_question(q, idx, styles)
            story.append(KeepTogether(elems))
            idx += 1

    if sa_questions:
        story.append(Spacer(1, 8))
        story.append(_section_banner(f"Section 2 — Short Answer"))
        story.append(Spacer(1, 8))
        for q in sa_questions:
            elems = _render_question(q, idx, styles)
            story.append(KeepTogether(elems))
            idx += 1

    if wp_questions:
        story.append(Spacer(1, 8))
        story.append(_section_banner(f"Section 3 — Word Problems"))
        story.append(Spacer(1, 8))
        for q in wp_questions:
            elems = _render_question(q, idx, styles)
            story.append(KeepTogether(elems))
            idx += 1

    # Any remaining
    other = [q for q in questions if q.get("type") not in ("multiple_choice", "short_answer", "word_problem")]
    for q in other:
        elems = _render_question(q, idx, styles)
        story.append(KeepTogether(elems))
        idx += 1

    def _footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(COLOR_GRAY)
        canvas.drawString(0.75 * inch, 0.4 * inch, f"QuizForge | {title} | Version {version} | Grade {grade_level}")
        canvas.drawRightString(
            letter[0] - 0.75 * inch, 0.4 * inch,
            f"Page {doc.page}"
        )
        canvas.restoreState()

    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
    logger.info(f"Generated worksheet PDF: {filepath}")
    return filename


def generate_answer_key_pdf(
    generation_id: int,
    questions_a: List[dict],
    questions_b: List[dict],
    answer_key: dict,
    title: str,
    subject: str,
    grade_level: str,
    topic: str,
) -> str:
    filename = f"gen_{generation_id}_answer_key.pdf"
    filepath = os.path.join(PDF_DIR, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = _get_styles()
    story = []

    # Header
    story.append(_header_table(title, f"{subject} | Grade {grade_level}", "ANSWER KEY"))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"Topic: {topic} | FOR TEACHER USE ONLY", styles["Subtitle"]))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=COLOR_PRIMARY))
    story.append(Spacer(1, 10))

    # Summary table
    total_a = answer_key.get("total_points_a", 0)
    total_b = answer_key.get("total_points_b", 0)
    summary_data = [
        ["Version", "Total Points", "Questions"],
        ["A", str(total_a), str(len(questions_a))],
        ["B", str(total_b), str(len(questions_b))],
    ]
    summary_t = Table(summary_data, colWidths=[2 * inch, 2 * inch, 2 * inch])
    summary_t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), COLOR_PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, COLOR_LINE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [COLOR_LIGHT, colors.white]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(summary_t)
    story.append(Spacer(1, 16))

    for version_label, q_list, key_list in [
        ("A", questions_a, answer_key.get("version_a", [])),
        ("B", questions_b, answer_key.get("version_b", [])),
    ]:
        story.append(_section_banner(f"Version {version_label} — Answer Key"))
        story.append(Spacer(1, 8))

        key_map = {item["id"]: item for item in key_list}

        for q in q_list:
            q_id = q.get("id", 0)
            key_item = key_map.get(q_id, {})
            answer = key_item.get("answer", q.get("correct_answer", "N/A"))
            explanation = key_item.get("explanation", q.get("explanation", ""))

            q_block = [
                Paragraph(
                    f"<b>Q{q_id}.</b> {q.get('question', '')[:120]}{'...' if len(q.get('question','')) > 120 else ''}",
                    styles["Body2"]
                ),
                Paragraph(f"✓  Answer: {answer}", styles["AnswerKey"]),
            ]
            if explanation:
                q_block.append(Paragraph(f"Explanation: {explanation}", styles["AnswerExplanation"]))

            q_block.append(Spacer(1, 4))
            story.append(KeepTogether(q_block))

        story.append(Spacer(1, 16))

    def _footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(COLOR_GRAY)
        canvas.drawString(0.75 * inch, 0.4 * inch, "QuizForge | ANSWER KEY — CONFIDENTIAL")
        canvas.drawRightString(letter[0] - 0.75 * inch, 0.4 * inch, f"Page {doc.page}")
        canvas.restoreState()

    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
    logger.info(f"Generated answer key PDF: {filepath}")
    return filename
