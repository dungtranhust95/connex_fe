import {
    Button, Col, Container, Row
} from "components";
import { Formik, Form } from "formik";
import React, { useEffect, useState, useRef } from "react";
import _ from "lodash";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RESPONSE_STATUS } from "helper/constantsDefined";
import { getCurrentCompanyUUIDByStore } from "helper/utilities";
import useToast from "routes/hooks/useToast";
import StickyFooter from "components/StickyFooter";
import { useHistory, useLocation } from "react-router";
import { HeaderMain } from "routes/components/HeaderMain";
import useUnsavedChangesWarning from "routes/components/UseUnsaveChangeWarning/useUnsaveChangeWarning";
import PrivilegesService from "services/PrivilegesService";
import ManageRolesService from "services/ManageRolesService/ManageRolesService";
import { v4 as uuidv4 } from "uuid";
import DOXA_ADMIN_MANAGE_ROLES_ROUTES from "../routes";
import { AssignDefaultFeatures, RoleSetup } from "../components";
import roleSetupSchema from "../helper";

export default function DoxaAdminRoleDetails() {
    const { t } = useTranslation();
    const history = useHistory();
    const location = useLocation();
    const authReducer = useSelector((state) => state.authReducer);
    const permissionReducer = useSelector((state) => state.permissionReducer);
    const { userDetails } = authReducer;
    const showToast = useToast();
    const formRef = useRef(null);

    const [Prompt, setDirty, setPristine] = useUnsavedChangesWarning();

    const [roleDetailsStates, setRoleDetailsStates] = useState({
        roleUuid: "",
        companyUuid: ""
    });
    const [listModules, setListModules] = useState([]);
    const [roleDetails, setRoleDetails] = useState({});
    const [rolesGridApi, setRolesGridApi] = useState(null);
    const [isEdit, setIsEdit] = useState(true);

    const initialValues = { role: "" };

    const extractCompanyAuthData = (modules) => {
        const listModulesTemp = [];
        modules?.forEach((module) => {
            const { moduleCode, features } = module;
            const newFeatures = features.map((feature) => ({
                featureName: feature.featureName,
                featureCode: feature.featureCode,
                read: false,
                write: false,
                approve: false,
                moduleCode,
                uuid: uuidv4()
            }));
            listModulesTemp.push(...newFeatures);
        });
        return listModulesTemp;
    };

    const getDataResponse = (responseData, type = "array") => {
        if (responseData.status === RESPONSE_STATUS.FULFILLED) {
            const { value } = responseData;
            if (!value) return type === "array" ? [] : {};
            const { status, data, message } = value && value.data;
            if (status === RESPONSE_STATUS.OK) {
                return data;
            }
            showToast("error", message);
        } else {
            const { response } = responseData && responseData.reason;
            showToast("error", response.data.message || response.data.error);
        }
        return type === "array" ? [] : {};
    };

    const initData = async (companyUuid, isDetails, uuid = "") => {
        try {
            const responses = await Promise.allSettled([
                PrivilegesService.getListAllFeatures(),
                isDetails && ManageRolesService.getDefaultRoleDetails(uuid)
            ]);
            const [
                responseAuthorities,
                responseRoleDetails
            ] = responses;
            const modules = getDataResponse(responseAuthorities);
            setListModules(extractCompanyAuthData(modules));

            const roleData = getDataResponse(responseRoleDetails, "object");
            setRoleDetails({
                ...roleData,
                name: location.pathname.includes("/create-role") && roleData.name ? `${roleData.name} (NEW)` : roleData.name
            });

            setRoleDetailsStates((prevStates) => ({
                ...prevStates,
                companyUuid,
                roleUuid: uuid
            }));
        } catch (error) {
            showToast("error", error.response ? error.response.data.message : error.message);
        }
    };

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const roleUuid = query.get("uuid");
        if (!_.isEmpty(permissionReducer)
            && !_.isEmpty(userDetails)) {
            const companyUuid = getCurrentCompanyUUIDByStore(permissionReducer);
            if (companyUuid && formRef?.current) {
                initData(
                    companyUuid,
                    !!roleUuid,
                    roleUuid
                );
            }
        }
    }, [permissionReducer, userDetails]);

    const generatePayloadPermission = () => {
        const permissions = [];
        rolesGridApi.forEachNode((node) => {
            const { data } = node;
            if (data) {
                const { featureCode } = data;
                const permission = {
                    featureCode,
                    actions: []
                };
                if (data.read) permission.actions.push("READ");
                if (data.write) permission.actions.push("WRITE");
                if (data.approve) permission.actions.push("APPROVE");
                permissions.push(permission);
            }
        });
        return permissions.filter((item) => item.actions.length > 0);
    };

    const updateNewListModule = (permissions) => {
        const newListModules = [...listModules];
        listModules.forEach((item, index) => {
            const permission = permissions?.find(
                (element) => element?.featureCode === item?.featureCode
            );
            if (permission) {
                newListModules[index].read = permission.actions.includes("READ");
                newListModules[index].write = permission.actions.includes("WRITE");
                newListModules[index].approve = permission.actions.includes("APPROVE");
                newListModules[index].disabled = true;
            }
        });
        setListModules(newListModules);
    };

    const onCreatePressHandler = async (values) => {
        setPristine();
        try {
            const body = {
                name: "",
                description: "",
                permissions: []
            };
            body.name = values.role;
            body.permissions = generatePayloadPermission();

            const response = await ManageRolesService.createNewDefaultRole(body);

            if (response.data.status === RESPONSE_STATUS.OK) {
                showToast("success", response.data.message || t("CreatedSuccessfully"));
                setTimeout(() => {
                    history.push(DOXA_ADMIN_MANAGE_ROLES_ROUTES.ROLES_LIST);
                }, 1000);
            } else {
                showToast("error", response.data.message);
            }
        } catch (error) {
            showToast("error", error.response ? error.response.data.message : error.message);
        }
    };

    const onEditPressHandler = async (values) => {
        setPristine();
        try {
            const { roleUuid } = roleDetailsStates;
            const body = {
                name: "",
                description: "",
                permissions: []
            };
            body.name = values.role;
            body.permissions = generatePayloadPermission();

            const response = await ManageRolesService.updateDefaultRole(roleUuid, body);

            if (response.data.status === RESPONSE_STATUS.OK) {
                showToast("success", response.data.message);
                updateNewListModule(body.permissions);
                setIsEdit(false);
                const companyUuid = getCurrentCompanyUUIDByStore(permissionReducer);
                initData(companyUuid, location.pathname.includes("/role-details"), roleUuid);
            } else {
                showToast("error", response.data.message);
            }
        } catch (error) {
            showToast("error", error.response ? error.response.data.message : error.message);
        }
    };

    const renderButtonActionDetailsScreen = (values, dirty, errors) => {
        if (isEdit) {
            return (
                <Row className="mx-0">
                    <Button
                        color="primary"
                        type="submit"
                        onClick={
                            () => {
                                if (!dirty
                                    || (dirty
                                        && Object.keys(errors).length)
                                ) {
                                    showToast("error", errors.vendorUuid || "Validation error, please check your input.");
                                    return;
                                }

                                onEditPressHandler(values);
                            }
                        }
                    >
                        {t("Save")}
                    </Button>
                </Row>
            );
        }
        return (
            <Row className="mx-0">
                <Button className="mb-2 btn-facebook btn-secondary" onClick={() => setIsEdit(true)}>
                    {`${t("Edit")} `}
                    <i className="fa fa-pencil ml-1" />
                </Button>
            </Row>
        );
    };

    const backBtnHandler = () => {
        if (location.pathname.includes("/role-details") && isEdit) {
            const query = new URLSearchParams(location.search);
            const roleUuid = query.get("uuid");
            setIsEdit(false);
            const companyUuid = getCurrentCompanyUUIDByStore(permissionReducer);
            if (companyUuid) {
                initData(
                    companyUuid,
                    location.pathname.includes("/role-details"),
                    roleUuid
                );
            }
        } else {
            setPristine();
            history.goBack();
        }
    };

    const mappingModule = (permissions) => {
        const newListModules = [...listModules];
        listModules.forEach((item, index) => {
            const permission = permissions?.find(
                (element) => element?.feature?.featureCode === item?.featureCode
            );
            if (permission) {
                newListModules[index].read = permission.read;
                newListModules[index].write = permission.write;
                newListModules[index].approve = permission.approve;
            }
        });
        return newListModules;
    };

    return (
        <Container fluid>
            <Formik
                innerRef={formRef}
                initialValues={initialValues}
                validationSchema={roleSetupSchema}
                onSubmit={() => { }}
            >
                {({
                    errors, values, touched, setFieldValue, dirty, setTouched
                }) => {
                    useEffect(() => {
                        if (!_.isEmpty(roleDetails)) {
                            if (location.pathname.includes("/role-details")) {
                                setIsEdit(false);
                            }
                            setFieldValue("role", roleDetails.name);
                            const newListModules = mappingModule(roleDetails.permissions);
                            setListModules(newListModules);
                        }
                    }, [roleDetails]);

                    useEffect(() => {
                        if (values.groupCode && location.pathname.includes("/role-details")) {
                            setTouched({ ...touched, role: true });
                        }
                        if (values.role && isEdit) setDirty();
                    }, [values]);

                    return (
                        <Form>
                            <Row className="mx-0 justify-content-between">
                                {
                                    location.pathname.includes("/create-role")
                                    && (
                                        <HeaderMain
                                            title={t("CreateNewRole")}
                                            className="mb-3 mb-lg-3"
                                        />
                                    )
                                }
                                {
                                    location.pathname.includes("/role-details")
                                    && (
                                        <HeaderMain
                                            title={t("RoleDetails")}
                                            className="mb-3 mb-lg-3"
                                        />
                                    )
                                }
                            </Row>
                            <Row className="mb-3">
                                <Col md={12} lg={12}>
                                    <RoleSetup
                                        t={t}
                                        disabled={!isEdit}
                                        values={values}
                                        touched={touched}
                                        errors={errors}
                                    />
                                </Col>
                            </Row>

                            <Row className="mb-3">
                                <Col md={12} lg={12}>
                                    <AssignDefaultFeatures
                                        t={t}
                                        listModules={listModules}
                                        disabled={!isEdit}
                                        setRolesGridApi={setRolesGridApi}
                                    />
                                </Col>
                            </Row>

                            <StickyFooter>
                                <Row className="mx-0 px-3 justify-content-between">
                                    <Button
                                        color="secondary"
                                        onClick={backBtnHandler}
                                        style={{
                                            height: 36
                                        }}
                                    >
                                        {t("Back")}
                                    </Button>
                                    {
                                        location.pathname.includes("/create-role")
                                        && (
                                            <Row className="mx-0">
                                                <Button
                                                    color="primary"
                                                    type="submit"
                                                    onClick={
                                                        () => {
                                                            if (!dirty
                                                                || (dirty
                                                                    && Object.keys(errors).length)
                                                            ) {
                                                                showToast("error", errors.vendorUuid || "Validation error, please check your input.");
                                                                return;
                                                            }

                                                            onCreatePressHandler(values);
                                                        }
                                                    }
                                                >
                                                    {t("Create")}
                                                </Button>
                                            </Row>
                                        )
                                    }
                                    {/* {
                                        location.pathname.includes("/role-details")
                                        && (
                                            renderButtonActionDetailsScreen(
                                                values, dirty,
                                                errors, setFieldValue
                                            )
                                        )
                                    } */}
                                </Row>
                            </StickyFooter>
                        </Form>
                    );
                }}
            </Formik>
            {Prompt}
        </Container>
    );
}
