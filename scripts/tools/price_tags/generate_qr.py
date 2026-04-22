import re
import qrcode
import base64
from io import BytesIO

data = """Name	MRP	LS Price
Radhuni BBQ Masala 50gm	80	78
Radhuni Biriyani Masala 40gm	60	58
Radhuni Borhani Masala 50gm	40	38
Radhuni Chicken Tandoori 50gm	80	78
Radhuni Chotpoti Masala 50gm 	50	48
Radhuni Chui Jhal Mangsho Masala 38gm	120	115
Radhuni Dhoniya Gura 500gm	240	238
Radhuni Dhoniya Gura 200gm 	110	108
Radhuni Dhoniya Gura 100gm	60	58
Radhuni Dhoniya Gura 50gm	32	30
Radhuni Dhoniya Gura 15gm	10	10
Radhuni Fried Chicken Mix 75gm	80	78
Radhuni Fried Rice Mix 8gm	10	10
Radhuni Gorom Masala 40gm	95	93
Radhuni Gorom Masala Gura 15gm	40	38
Radhuni Gorur Mangsho Masala 100gm	90	78
Radhuni Gorur Masala 25gm	25	23
Radhuni Hasher Mangsho 33gm	60	58
Radhuni Holud Gura 500gm	335	330
Radhuni Holud Gura 200gm	145	140
Radhuni Holud Gura 100gm	75	72
Radhuni Holud Gura 50gm	40	38
Radhuni Holud Gura 25gm	20	18
Radhuni Jira Gura 200gm	310	308
Radhuni Jira Gura 100gm	160	158
Radhuni Jira Gura 50gm	85	83
Radhuni Jira Gura 15gm	28	28
Radhuni Kabab Masala 50gm	100	98
Radhuni Kacchi Biriyani Masala 40gm	70	67
Radhuni Kala Bhuna 80gm	100	98
Radhuni Kasundi 285ml	65	65
Radhuni Korma Masala 30gm	50	48
Radhuni Macher Masala 20gm	18	18
Radhuni Mangsho Masala 100gm	95	93
Radhuni Mezbani Gorur Masala 68gm	100	98
Radhuni Morich Gura 500gm	345	335
Radhuni Morich Gura 200gm	140	135
Radhuni Morich Gura 100gm	75	70
Radhuni Morich Gura 50gm	38	35
Radhuni Morich Gura 25gm	20	20
Radhuni Murgi Mangsho 20gm	20	20
Radhuni Murgir Masala 100gm	95	93
Radhuni Panch Phoron 50gm	30	30
Radhuni Premium Ghee 200gm	425	425
Radhuni Premium Ghee 100gm	230	230
Radhuni Roast Masala 35gm	65	65
Radhuni Shorisha Oil 1ltr	360	350
Radhuni Shorisha Oil 500ml	185	180
Radhuni Shorisha Oil 250ml	95	90
Radhuni Shorisha Oil 80ml	35	35
Radhuni Sunflower Oil 1ltr	490	480
Radhuni Tehari Masala 40gm	55	55
Radhuni Vinegar 540ml	70	70
Radhuni Vinegar 280ml	45	45
Radhuni Panch Phoron Powder 25gm	30	30"""

html_head = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Price Tags QR Cart - A4 Sheets</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap" rel="stylesheet">
<style>
  body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #e0e0e0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  
  /* A4 Sheet Container */
  .sheet {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    justify-content: space-between;
    width: 210mm;
    height: 297mm;
    background-color: white;
    padding: 10mm;
    box-sizing: border-box;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    page-break-after: always;
  }
  
  /* Main Container for Tag */
  .tag-wrapper {
      width: 92mm;
      height: 48mm;
      border: 2px solid #333;
      border-radius: 8px;
      margin-bottom: 5mm;
      box-sizing: border-box;
      background: #fff;
      position: relative;
      overflow: hidden;
      display: flex;
      page-break-inside: avoid;
  }

  /* Left Sideways Barcode */
  .left-barcode {
      width: 8mm;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Libre Barcode 128', cursive;
      font-size: 28px;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      border-right: 1px solid #ccc;
      color: #000;
  }

  .tag-content {
      width: 84mm;
      display: flex;
      flex-direction: column;
      height: 100%;
  }

  /* Top Section */
  .top-section {
      height: 12mm;
      background: #fff;
      display: flex;
      padding: 2mm 3mm;
      box-sizing: border-box;
      justify-content: space-between;
      align-items: flex-start;
  }

  .product-name {
      font-size: 15px;
      font-weight: bold;
      line-height: 1.15;
      width: 68%;
      color: #000;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
  }

  .top-right-barcode {
      width: 30%;
      text-align: right;
  }
  
  .barcode-font {
      font-family: 'Libre Barcode 128', cursive;
      font-size: 30px;
      line-height: 20px;
      margin-bottom: 2px;
  }

  .barcode-text {
      font-size: 8px;
      letter-spacing: 1px;
  }

  /* Middle Yellow Section */
  .middle-section {
      height: 25mm;
      background-color: #FACC0A; 
      display: flex;
      flex-direction: column;
      padding: 1mm 3mm;
      box-sizing: border-box;
      position: relative;
      border-top: 1px solid #ccc;
  }

  .price-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 1mm;
  }

  .was-price-box {
      display: flex;
      flex-direction: column;
      margin-top: 4px;
      width: 15%;
  }
  .was-label {
      font-size: 9px;
      font-weight: 600;
  }
  .was-value {
      font-size: 11px;
      text-decoration: line-through;
      font-weight: 600;
  }

  .current-price-box {
      font-weight: 900;
      color: #000;
      letter-spacing: -2px;
      text-align: center;
      width: 63%;
      display: flex;
      justify-content: center;
      align-items: flex-start;
  }
  .price-int {
      font-size: 42px;
      line-height: 40px;
  }
  .price-dec-container {
       margin-top: 2px;
  }
  .price-comma {
      font-size: 18px;
      font-weight: 800;
      margin-right: 1px;
  }
  .price-dec {
      font-size: 18px;
      line-height: 18px;
      font-weight: 800;
      text-decoration: underline;
  }

  .right-col {
      width: 22%;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-top: 2px;
  }
  .save-box {
      width: 100%;
  }
  .save-label {
      background: #fff;
      text-align: center;
      font-weight: 900;
      font-size: 10px;
      padding: 2px 0;
      border: 1px solid #000;
      border-bottom: none;
      letter-spacing: 0.5px;
  }
  .save-value-box {
      background: #000;
      color: #fff;
      text-align: center;
      font-weight: 800;
      padding: 3px 0;
      font-size: 15px;
      display: flex;
      justify-content: center;
      align-items: flex-start;
  }
  .save-dec {
      font-size: 9px;
      margin-top: 1px;
      margin-left: 1px;
  }

  .qr-wrapper {
      width: 13mm;
      height: 13mm;
      margin-top: 2px;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      mix-blend-mode: multiply;
  }

  .qr-code {
      width: 100%;
      height: 100%;
      object-fit: contain;
  }

  .properties-bottom {
      font-size: 6.5px;
      line-height: 1.2;
      position: absolute;
      bottom: 1.5mm;
      left: 3mm;
      width: 70%;
  }

  /* Bottom Red Section */
  .bottom-section {
      height: 7mm;
      background-color: #C62B28; 
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 3mm;
      font-weight: bold;
      border-top: 1px solid #991e1b;
  }
  .bottom-text {
      display: flex;
      align-items: baseline;
  }
  .member-text {
      font-size: 12px;
      margin-right: 4px;
  }
  .signup-text {
      font-size: 8px;
      font-weight: normal;
  }
  
  .whatsapp-qr {
      height: 5.5mm;
      width: 5.5mm;
      background: #fff;
      padding: 0.5mm;
      border-radius: 1px;
      display: flex;
      justify-content: center;
      align-items: center;
  }
  
  .whatsapp-qr img {
      width: 100%;
      height: 100%;
      object-fit: cover;
  }

  @media print {
    body { background: none; padding: 0; }
    .sheet { box-shadow: none; margin: 0; padding: 10mm; page-break-after: always; }
    @page { size: A4; margin: 0; }
  }
</style>
</head>
<body>
"""

html_tail = """
</body>
</html>
"""

lines = data.strip().split('\n')
valid_tags = []

for idx, line in enumerate(lines):
    if idx == 0:
        continue # Skip header
    
    cols = [c.strip() for c in line.split('\t') if c.strip()]
    if len(cols) >= 3:
        name = cols[0]
        mrp_str = cols[1]
        ls_str = cols[2]
    else:
        continue

    try:
        mrp = float(mrp_str)
        ls_price = float(ls_str)
    except ValueError:
        continue
        
    savings = mrp - ls_price
    if savings < 0:
        savings = 0.0
        
    ls_int = int(ls_price)
    ls_dec = int(round((ls_price - ls_int) * 100))
    ls_dec_str = f"{ls_dec:02d}"

    save_int = int(savings)
    save_dec = int(round((savings - save_int) * 100))
    save_dec_str = f"{save_dec:02d}"
    
    fake_sku = f"{200000 + idx}R"
    
    # Generate dynamic QR code
    cart_url = f"https://luckystore.com/qr-cart?sku={fake_sku}"
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=0,
    )
    qr.add_data(cart_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buf = BytesIO()
    img.save(buf, format="PNG")
    base64_img = base64.b64encode(buf.getvalue()).decode('utf-8')
    dynamic_qr_src = f"data:image/png;base64,{base64_img}"
    
    tag_html = f'''
    <div class="tag-wrapper">
      <div class="left-barcode">||||||||||||||</div>
      
      <div class="tag-content">
        <div class="top-section">
          <div class="product-name">{name}</div>
          <div class="top-right-barcode">
             <div class="barcode-font">{fake_sku}</div>
             <div class="barcode-text">{fake_sku}</div>
          </div>
        </div>
        
        <div class="middle-section">
          <div class="price-row">
              <div class="was-price-box">
                 <div class="was-label">was</div>
                 <div class="was-value">{mrp:.2f}</div>
              </div>
              
              <div class="current-price-box">
                 <span class="price-int">{ls_int}</span>
                 <div class="price-dec-container">
                    <span class="price-comma">,</span><span class="price-dec">{ls_dec_str}</span>
                 </div>
              </div>
              
              <div class="right-col">
                  <div class="save-box">
                     <div class="save-label">SAVE</div>
                     <div class="save-value-box">
                         {save_int}<span class="save-dec">,{save_dec_str}</span>
                     </div>
                  </div>
                  <div class="qr-wrapper">
                      <img src="{dynamic_qr_src}" class="qr-code" alt="Cart QR" />
                  </div>
              </div>
          </div>
          
          <div class="properties-bottom">
             Art.nr. {fake_sku}<br/>
             Lucky Store Exclusive Quality Product
          </div>
        </div>
        
        <div class="bottom-section">
           <div class="bottom-text">
               <span class="member-text">Member Price!</span>
               <span class="signup-text">- Sign Up Now & Get Offers!</span>
           </div>
           <div class="whatsapp-qr">
               <img src="qr_code.png" alt="WhatsApp" />
           </div>
        </div>
      </div>
    </div>
    '''
    valid_tags.append(tag_html)

# Now chunk into 10 per page
html_content = html_head

for i in range(0, len(valid_tags), 10):
    html_content += '<div class="sheet">\\n'
    chunk = valid_tags[i:i+10]
    for tag_html in chunk:
        html_content += tag_html
    html_content += '</div>\\n'

html_content += html_tail

with open('/Users/mac.alvi/Desktop/Projects/Lucky Store/price_tags_qr.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print(f"Generated {len(valid_tags)} dynamic QR tags across {len(valid_tags) // 10 + (1 if len(valid_tags) % 10 != 0 else 0)} A4 sheets.")
