from fpdf import FPDF

class PDF(FPDF):
    def __init__(self):
        super().__init__()
        self.is_first_page = True
        self.table_line_height = 6
        self.col_widths = [40, 40, 90]

    def header(self):
        if self.is_first_page:
            self.set_font('Arial', 'B', 24)
            self.cell(0, 20, 'Cahier des Charges - FastMoto', 0, 1, 'C')
            self.ln(10)
            self.is_first_page = False
        else:
            self.line(10, 10, 200, 10)
        
    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

    def create_table_header(self, headers):
        self.set_font('Arial', 'B', 10)
        self.set_fill_color(200, 200, 200)
        for i, header in enumerate(headers):
            self.cell(self.col_widths[i], self.table_line_height, header, 1, 0, 'C', True)
        self.ln()

    def add_table_row(self, data):
        self.set_font('Arial', '', 10)
        x = self.get_x()
        max_height = self.table_line_height
        
        # Calculate required height
        for i, text in enumerate(data):
            length = self.get_string_width(str(text))
            lines = max(int(length / self.col_widths[i]) + 1, 1)
            max_height = max(max_height, lines * self.table_line_height)
        
        # Print cells
        for i, text in enumerate(data):
            self.multi_cell(self.col_widths[i], max_height, str(text), 1, 'L')
            self.set_xy(x + sum(self.col_widths[:i+1]), self.get_y() - max_height)
        
        self.ln(max_height)

# Create PDF instance
pdf = PDF()
pdf.set_auto_page_break(auto=True, margin=15)
pdf.add_page()

# Read the markdown content
with open('FastMoto_Specification_Document.md', 'r', encoding='utf-8') as file:
    content = file.read()

# Process and write content
in_table = False
table_headers = []
table_data = []

for line in content.split('\n'):
    line = line.strip()
    if not line:
        continue

    # Handle table
    if line.startswith('|'):
        if not in_table:
            in_table = True
            headers = [col.strip() for col in line.split('|')[1:-1]]
            if not line.startswith('|-'):
                table_headers = headers
        elif not line.startswith('|-'):
            data = [col.strip() for col in line.split('|')[1:-1]]
            table_data.append(data)
        continue
    elif in_table:
        # Print the accumulated table
        if table_headers and table_data:
            pdf.create_table_header(table_headers)
            for row in table_data:
                pdf.add_table_row(row)
            pdf.ln(5)
        in_table = False
        table_headers = []
        table_data = []

    # Handle regular content
    try:
        if line.startswith('# '):
            continue  # Skip main title as it's handled in header
        elif line.startswith('## '):
            pdf.set_font('Arial', 'B', 16)
            pdf.multi_cell(0, 10, line.replace('##', '').strip())
            pdf.ln(5)
        elif line.startswith('### '):
            pdf.set_font('Arial', 'B', 14)
            pdf.multi_cell(0, 10, line.replace('###', '').strip())
            pdf.ln(3)
        elif line.startswith('#### '):
            pdf.set_font('Arial', 'B', 12)
            pdf.multi_cell(0, 10, line.replace('####', '').strip())
        elif line.startswith('- '):
            pdf.set_font('Arial', '', 11)
            pdf.set_x(20)
            pdf.multi_cell(0, 7, '- ' + line[2:].strip())
        else:
            pdf.set_font('Arial', '', 11)
            pdf.multi_cell(0, 7, line)
    except Exception as e:
        print(f"Skipping line due to encoding issue: {line}")
        continue

# Save the PDF
try:
    pdf.output('Cahier_des_Charges_FastMoto.pdf')
    print("PDF generated successfully!")
except Exception as e:
    print(f"Error generating PDF: {str(e)}")
