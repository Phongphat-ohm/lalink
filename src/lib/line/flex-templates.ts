export interface LeaveFlexData {
  requestNumber: string;
  employeeName: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason?: string;
  companyName: string;
}

const BRAND_TEAL = "#0D9488";
const ACCENT_EMERALD = "#10B981";
const ACCENT_ROSE = "#E11D48";
const ACCENT_AMBER = "#F59E0B";
const ACCENT_SLATE = "#64748B";

/**
 * 1. Flex Message: เมื่อพนักงานยื่นใบลา (Submitted - รอพิจารณา)
 */
export function buildLeaveSubmittedFlex(data: LeaveFlexData) {
  return {
    type: "flex",
    altText: `ใบลาเลขที่ ${data.requestNumber} อยู่ระหว่างรอพิจารณา`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: BRAND_TEAL,
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: data.companyName || "LALINK HR",
            color: "#CCFBF1",
            size: "xxs",
            weight: "bold",
            textTransform: "uppercase",
          },
          {
            type: "text",
            text: "ยื่นใบลาเรียบร้อยแล้ว",
            color: "#FFFFFF",
            size: "lg",
            weight: "bold",
            margin: "sm",
          },
          {
            type: "text",
            text: `เลขที่: ${data.requestNumber}`,
            color: "#99F6E4",
            size: "xs",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "สถานะ",
                size: "xs",
                color: "#64748B",
                flex: 2,
              },
              {
                type: "text",
                text: "รอการอนุมัติ (Pending)",
                size: "xs",
                color: ACC_AMBER_COLOR(),
                weight: "bold",
                flex: 4,
                align: "end",
              },
            ],
          },
          {
            type: "separator",
            margin: "md",
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "ผู้ยื่นใบลา",
                    size: "xs",
                    color: "#64748B",
                    flex: 2,
                  },
                  {
                    type: "text",
                    text: data.employeeName,
                    size: "xs",
                    color: "#0F172A",
                    weight: "bold",
                    flex: 4,
                    align: "end",
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "ประเภทการลา",
                    size: "xs",
                    color: "#64748B",
                    flex: 2,
                  },
                  {
                    type: "text",
                    text: data.leaveTypeName,
                    size: "xs",
                    color: "#0F172A",
                    weight: "bold",
                    flex: 4,
                    align: "end",
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "ช่วงวันที่ลา",
                    size: "xs",
                    color: "#64748B",
                    flex: 2,
                  },
                  {
                    type: "text",
                    text: `${data.startDate} - ${data.endDate}`,
                    size: "xs",
                    color: "#0F172A",
                    flex: 4,
                    align: "end",
                  },
                ],
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "จำนวนวันลา",
                    size: "xs",
                    color: "#64748B",
                    flex: 2,
                  },
                  {
                    type: "text",
                    text: `${data.totalDays} วัน`,
                    size: "xs",
                    color: BRAND_TEAL,
                    weight: "bold",
                    flex: 4,
                    align: "end",
                  },
                ],
              },
              ...(data.reason
                ? [
                    {
                      type: "box",
                      layout: "horizontal",
                      contents: [
                        {
                          type: "text",
                          text: "เหตุผล",
                          size: "xs",
                          color: "#64748B",
                          flex: 2,
                        },
                        {
                          type: "text",
                          text: data.reason,
                          size: "xs",
                          color: "#334155",
                          flex: 4,
                          align: "end",
                          wrap: true,
                        },
                      ],
                    },
                  ]
                : []),
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "15px",
        backgroundColor: "#F8FAFC",
        contents: [
          {
            type: "text",
            text: "ระบบจะแจ้งเตือนเมื่อคำขอของคุณได้รับการพิจารณา",
            size: "xxs",
            color: "#94A3B8",
            align: "center",
          },
        ],
      },
    },
  };
}

/**
 * 2. Flex Message: เมื่อใบลาได้รับการอนุมัติ (Approved)
 */
export function buildLeaveApprovedFlex(data: LeaveFlexData) {
  return {
    type: "flex",
    altText: `คำขอลาเลขที่ ${data.requestNumber} ได้รับการอนุมัติแล้ว`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: ACCENT_EMERALD,
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: data.companyName || "LALINK HR",
            color: "#D1FAE5",
            size: "xxs",
            weight: "bold",
            textTransform: "uppercase",
          },
          {
            type: "text",
            text: "✓ อนุมัติใบลาเรียบร้อยแล้ว",
            color: "#FFFFFF",
            size: "lg",
            weight: "bold",
            margin: "sm",
          },
          {
            type: "text",
            text: `เลขที่: ${data.requestNumber}`,
            color: "#A7F3D0",
            size: "xs",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: `สวัสดีคุณ ${data.employeeName}`,
            size: "sm",
            weight: "bold",
            color: "#0F172A",
          },
          {
            type: "text",
            text: `คำขอลางาน ${data.leaveTypeName} จำนวน ${data.totalDays} วัน (${data.startDate} - ${data.endDate}) ได้รับการอนุมัติจากผู้บังคับบัญชาเรียบร้อยแล้ว`,
            size: "xs",
            color: "#334155",
            margin: "sm",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "15px",
        backgroundColor: "#F8FAFC",
        contents: [
          {
            type: "text",
            text: "ยอดวันลาคงเหลือได้รับการปรับปรุงเรียบร้อยแล้ว",
            size: "xxs",
            color: "#64748B",
            align: "center",
          },
        ],
      },
    },
  };
}

/**
 * 3. Flex Message: เมื่อใบลาไม่ได้รับการอนุมัติ (Rejected)
 */
export function buildLeaveRejectedFlex(data: LeaveFlexData, reason: string) {
  return {
    type: "flex",
    altText: `คำขอลาเลขที่ ${data.requestNumber} ไม่ได้รับการอนุมัติ`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: ACCENT_ROSE,
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: data.companyName || "LALINK HR",
            color: "#FFE4E6",
            size: "xxs",
            weight: "bold",
            textTransform: "uppercase",
          },
          {
            type: "text",
            text: "✕ ไม่อนุมัติคำขอลางาน",
            color: "#FFFFFF",
            size: "lg",
            weight: "bold",
            margin: "sm",
          },
          {
            type: "text",
            text: `เลขที่: ${data.requestNumber}`,
            color: "#FECDD3",
            size: "xs",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: `สวัสดีคุณ ${data.employeeName}`,
            size: "sm",
            weight: "bold",
            color: "#0F172A",
          },
          {
            type: "text",
            text: `คำขอลางาน ${data.leaveTypeName} วันที่ ${data.startDate} - ${data.endDate} ไม่ผ่านการอนุมัติ`,
            size: "xs",
            color: "#334155",
            margin: "sm",
            wrap: true,
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            paddingAll: "12px",
            backgroundColor: "#FFF1F2",
            cornerRadius: "8px",
            contents: [
              {
                type: "text",
                text: "เหตุผลที่ไม่อนุมัติ:",
                size: "xs",
                weight: "bold",
                color: "#9F1239",
              },
              {
                type: "text",
                text: reason || "ไม่ได้ระบุเหตุผล",
                size: "xs",
                color: "#BE123C",
                margin: "xs",
                wrap: true,
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "15px",
        backgroundColor: "#F8FAFC",
        contents: [
          {
            type: "text",
            text: "โควตาวันลาของคุณได้รับการคืนสิทธิ์เข้าสู่ระบบเรียบร้อยแล้ว",
            size: "xxs",
            color: "#64748B",
            align: "center",
          },
        ],
      },
    },
  };
}

/**
 * 4. Flex Message: เมื่อมีการยกเลิกใบลา (Cancelled)
 */
export function buildLeaveCancelledFlex(data: LeaveFlexData) {
  return {
    type: "flex",
    altText: `คำขอลาเลขที่ ${data.requestNumber} ถูกยกเลิกแล้ว`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: ACCENT_SLATE,
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: data.companyName || "LALINK HR",
            color: "#E2E8F0",
            size: "xxs",
            weight: "bold",
            textTransform: "uppercase",
          },
          {
            type: "text",
            text: "ยกเลิกคำขอลาเรียบร้อยแล้ว",
            color: "#FFFFFF",
            size: "lg",
            weight: "bold",
            margin: "sm",
          },
          {
            type: "text",
            text: `เลขที่: ${data.requestNumber}`,
            color: "#CBD5E1",
            size: "xs",
            margin: "xs",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: `คำขอลางาน ${data.leaveTypeName} (${data.startDate} - ${data.endDate}) จำนวน ${data.totalDays} วัน ได้รับการยกเลิกแล้ว`,
            size: "xs",
            color: "#334155",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "15px",
        backgroundColor: "#F8FAFC",
        contents: [
          {
            type: "text",
            text: "สิทธิ์วันลาของคุณได้ถูกคืนเข้าสู่ระบบแล้ว",
            size: "xxs",
            color: "#64748B",
            align: "center",
          },
        ],
      },
    },
  };
}

function ACC_AMBER_COLOR() {
  return ACCENT_AMBER;
}
