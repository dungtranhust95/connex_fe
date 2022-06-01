import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
    Row,
    Card,
    CardBody,
    CardHeader,
    Col,
    Label,
    CustomInput
} from "components";
import { SelectInput } from "routes/P2P/PurchaseRequest/components";
import ApprovalMatrixManagementService from "services/ApprovalMatrixManagementService";
import useToast from "routes/hooks/useToast";
import { ErrorMessage, Field } from "formik";
import classNames from "classnames";
import SelectInputApproval from "routes/Entities/ProgressiveClaims/components/SelectInputApproval";
import { HorizontalInput } from "../../../components";

import { DPC_STATUS, PAGE_STAGE } from "../../Helper";

const GeneralInformation = React.memo(({
    values,
    errors,
    touched,
    approvalRoutes = [],
    draftClaimDetail = {},
    setFieldValue,
    currentCompany = "",
    handleChange,
    isBuyer = false,
    role = "Main_QS" // "ARCHITECT"
}) => {
    const { t } = useTranslation();
    // const {
    //     values,
    //     errors,
    //     touched,
    //     approvalRoutes = [],
    //     draftClaimDetail = {},
    //     setFieldValue,
    //     currentCompany = "",
    //     handleChange,
    //     isBuyer = false
    // } = props;
    const showToast = useToast();

    const checkRenderByStatus = (status) => {
        if (
            isBuyer
            && status !== DPC_STATUS.PENDING_ACKNOWLEDGEMENT
        ) {
            return true;
        } return false;
    };

    const checkEditableClaimDateByStatus = (status) => {
        if (
            status === DPC_STATUS.CREATED
            || status === DPC_STATUS.RECALLED
            || status === DPC_STATUS.SENT_BACK
        ) {
            return true;
        } return false;
    };

    const checkEditableApprovalByStatus = (status) => {
        if (
            [
                DPC_STATUS.PENDING_VALUATION,
                DPC_STATUS.RECALLED, DPC_STATUS.SENT_BACK,
                DPC_STATUS.PENDING_SUBMISSION
            ].includes(status)
        ) {
            return true;
        } return false;
    };

    const onChangeApprovalRoute = async (e) => {
        const { value } = e.target;
        setFieldValue("approvalRouteUuid", value);
        const { companyUuid } = currentCompany;
        try {
            const response = await ApprovalMatrixManagementService
                .getApprovalMatrixByApprovalUuid(companyUuid, value);
            const { data } = response.data;
            const { approvalRange } = data;
            let approvalSequence = "";
            approvalRange.forEach((approval, index) => {
                const { approvalGroups } = approval;
                if (index === 0) {
                    approvalSequence = approvalGroups[0].group.groupName;
                } else {
                    approvalSequence += ` > ${approvalGroups[0].group.groupName}`;
                }
            });
            setFieldValue("approvalSequence", approvalSequence);
        } catch (error) {
            showToast("error", error.response ? error.response.data.message : error.message);
        }
    };
    return (
        <Card className="mb-4">
            <CardHeader tag="h6">
                {t("General Information")}
            </CardHeader>
            <CardBody>
                <Row>
                    <Col xs={12}>
                        <HorizontalInput
                            name="contractType"
                            label={t("Contract Type")}
                            type="text"
                            disabled
                            value={values?.contractType?.replaceAll("_", " ")}
                        />
                        <HorizontalInput
                            name="workOrderTitle"
                            label={t("Work Order Title")}
                            type="text"
                            disabled
                        />
                        <HorizontalInput
                            name="paymentResponseReferenceNo"
                            label={t("Payment Response Reference No.")}
                            type="text"
                            disabled
                        />

                        <HorizontalInput
                            errors={errors.claimDate}
                            touched={touched.claimDate}
                            name="claimDate"
                            label={t("Claim Date")}
                            type="date"
                            className="label-required"
                            disabled={!checkEditableClaimDateByStatus(draftClaimDetail.pcStatus)}
                        />
                        {
                            checkRenderByStatus(draftClaimDetail.pcStatus)
                            && (
                                <>
                                    {
                                        checkEditableApprovalByStatus(draftClaimDetail.pcStatus)
                                            ? (
                                                <SelectInputApproval
                                                    id="approvalRouteUuid"
                                                    name="approvalRouteUuid"
                                                    label={t("ApprovalRoute")}
                                                    className="label-required"
                                                    placeholder={t("PleaseSelectApprovalRoute")}
                                                    errors={errors.approvalRouteUuid}
                                                    touched={touched.approvalRouteUuid}
                                                    options={approvalRoutes}
                                                    optionLabel="approvalName"
                                                    optionValue="uuid"
                                                    onChange={(e) => {
                                                        onChangeApprovalRoute(e);
                                                        handleChange(e);
                                                    }}
                                                    value={values.approvalRouteUuid}
                                                    messageValidate={t("PleaseSelectValidApprovalRoute")}
                                                    // disabled={!checkEditableApprovalByStatus(draftClaimDetail.dpcStatus)}
                                                />
                                            ) : (
                                                <HorizontalInput
                                                    name="approvalRouteName"
                                                    label={t("ApprovalRoute")}
                                                    type="text"
                                                    placeholder=""
                                                    disabled
                                                />
                                            )
                                    }
                                    <HorizontalInput
                                        name="approvalRouteSequence"
                                        label={t("ApprovalSequence")}
                                        type="text"
                                        placeholder=""
                                        errors={errors.approvalRouteSequence}
                                        touched={touched.approvalRouteSequence}
                                        disabled
                                    />
                                </>
                            )
                        }
                        <HorizontalInput
                            name="invoiceStatus"
                            label={t("Invoice Status")}
                            type="text"
                            disabled={!checkEditableClaimDateByStatus(draftClaimDetail.pcStatus)}
                        />
                        {
                            role === "ARCHITECT"
                            && (
                                <Row>
                                    <Col md={4} lg={4} className="d-flex">
                                        <Label className="p-0">{t("eSign Routing?*")}</Label>
                                    </Col>
                                    <Col md={8} lg={8}>
                                        <CustomInput
                                            type="checkbox"
                                            id="eSignRoutingCheckbox"
                                            name="eSignRouting"
                                            errors={errors.eSignRouting}
                                            touched={touched.eSignRouting}
                                            checked={values.eSignRouting}
                                        // onChange={(e) => setFieldValue("includeVariation", e.target.checked)}
                                        // disabled
                                        />
                                    </Col>
                                </Row>
                            )
                        }
                    </Col>
                </Row>
            </CardBody>
        </Card>
    );
});
export default GeneralInformation;
